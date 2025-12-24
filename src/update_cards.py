# -*- coding: utf-8 -*-
from __future__ import annotations
from pathlib import Path

"""
恋与深空 WIKI 抽卡卡片爬虫
----------------------------------------------------------------
- 仅保存图片/视频链接，不下载文件
- 礼貌 UA、限速、Session+Retry
- 兼容 iframe 被转义成文本（&lt;iframe ...&gt;）
- B 站播放器 URL 自动补参数并尝试匹配分 P
"""

import json
import time
import random
import re
import html
from copy import deepcopy
import requests
import mwclient
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse, parse_qs, urlencode, urlunparse
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# -----------------------------
# 配置
# -----------------------------
CARDS_PATH = "src/assets/cards.json"
POOL_CATEGORIES_PATH = "src/assets/poolCategories.json"
WIKI_BASE = "https://wiki.biligame.com/lysk/"
ENTRY_URL = WIKI_BASE + "%E6%80%9D%E5%BF%B5:%E7%AD%9B%E9%80%89"

# 统一许可
LICENSE_NAME = "CC BY-NC-SA 4.0"
LICENSE_URL = "https://creativecommons.org/licenses/by-nc-sa/4.0/"

UA = "GachaSimCrawler/1.0 (+mailto:chenczn3528@gmail.com)"  # 合规 UA
HEADERS = {"User-Agent": UA}

CATEGORY_PRIORITY = {
    ("wishSeries", "limited"): 1,
    ("wishSeries", "permanent"): 0,
}

CJK_RANGE = "\u4e00-\u9fff"
RE_WISH_AFTER = re.compile(rf"(?<![{CJK_RANGE}])许愿/")
RE_WISH_BEFORE = re.compile(rf"/许愿(?![{CJK_RANGE}])")
QUOTE_NAME_RE = re.compile(r"「([^」]+)」")

DEFAULT_POOL_CATEGORIES = {
    "wishSeries": {
        "name": "许愿系列",
        "icon": "🌠",
        "subcategories": {
            "limited": {"name": "限时卡池", "pools": []},
            "permanent": {"name": "常驻卡池", "pools": []},
        },
    },
    "specialRewards": {
        "name": "密约/挚礼系列",
        "icon": "🎁",
        "pools": [],
    },
}

# -----------------------------
# 会话与礼貌访问
# -----------------------------
session = requests.Session()
retries = Retry(
    total=5,
    backoff_factor=1.4,
    status_forcelist=[429, 500, 502, 503, 504],
    allowed_methods=["GET"],
    raise_on_status=False,
)
session.mount("https://", HTTPAdapter(max_retries=retries))
session.headers.update(HEADERS)

def polite_get(url: str, timeout: int = 15) -> requests.Response:
    """带随机延迟的 GET，避免给站点造成压力。"""
    time.sleep(1.5 + random.random())  # 1.5~2.5s
    resp = session.get(url, timeout=timeout)
    resp.raise_for_status()
    if not resp.encoding:
        resp.encoding = resp.apparent_encoding or "utf-8"
    return resp

# -----------------------------
# 工具函数
# -----------------------------
def parse_best_from_srcset(srcset: str) -> str:
    """从 srcset 选择清晰度较好的 URL：优先 2x，没有就最后一项。"""
    if not srcset:
        return ""
    parts = [p.strip() for p in srcset.split(",") if p.strip()]
    if not parts:
        return ""
    for part in reversed(parts):
        if part.endswith(" 2x") or part.endswith("2x"):
            return part.rsplit(" ", 1)[0]
    return parts[-1].rsplit(" ", 1)[0] if " " in parts[-1] else parts[-1]

# —— 从原始 HTML 中直接抓 <iframe> 块；并兼容被转义的 HTML
IFRAME_BLOCK_RE = re.compile(r'<iframe.*?</iframe>', re.IGNORECASE | re.DOTALL)
IFRAME_SRC_RE   = re.compile(r'src=["\']([^"\']+)["\']', re.IGNORECASE)
WIKI_LINK_RE = re.compile(r"\[\[([^\]]+)\]\]")
FULL_WIDTH_BRACKET_RE = re.compile(r"【([^】]+)】")
QUOTE_NAME_RE = re.compile(r"「([^」]+)」")
EVENT_GAIN_RE = re.compile(r"^在?(.+?)活动中获取$")

def extract_iframes(html_bytes_or_text) -> list[str]:
    """
    从原始 HTML（bytes 或 str）提取 <iframe> 块。
    1) 直接正则
    2) 若页面是转义文本（&lt;iframe ...&gt;），先 html.unescape 再正则
    """
    if isinstance(html_bytes_or_text, bytes):
        raw = html_bytes_or_text.decode("utf-8", errors="ignore")
    else:
        raw = html_bytes_or_text or ""

    blocks = IFRAME_BLOCK_RE.findall(raw)
    if blocks:
        return blocks

    unescaped = html.unescape(raw)
    if unescaped != raw:
        blocks = IFRAME_BLOCK_RE.findall(unescaped)
        if blocks:
            return blocks

    return []


def normalize_event_pool_name(name: str) -> str:
    match = EVENT_GAIN_RE.match(name)
    if match:
        return match.group(1).strip()
    return name


def clean_pool_name(text: str) -> str:
    if not text:
        return ""
    cleaned = text.strip()
    if "|" in cleaned:
        cleaned = cleaned.split("|")[-1]
    for ch in ("[", "]", "【", "】"):
        cleaned = cleaned.replace(ch, "")
    cleaned = cleaned.replace("「", "").replace("」", "")
    cleaned = normalize_event_pool_name(cleaned.strip())
    return cleaned


def extract_pool_name(get_str: str) -> str:
    if not get_str:
        return ""
    for pattern in (WIKI_LINK_RE, FULL_WIDTH_BRACKET_RE, QUOTE_NAME_RE):
        match = pattern.search(get_str)
        if match:
            candidate = clean_pool_name(match.group(1))
            if candidate:
                return candidate
    candidate = get_str.split("/")[0]
    candidate = candidate.split("，")[0]
    return clean_pool_name(candidate)


def extract_first_quote_name(get_str: str) -> str:
    if not get_str:
        return ""
    match = QUOTE_NAME_RE.search(get_str)
    if match:
        return clean_pool_name(match.group(1))
    return ""


def get_raw_get_field(card: dict) -> str:
    return (card.get("get") or "").replace("<br>", " ")


def has_standalone_wish_segment(text: str) -> bool:
    if not text:
        return False
    return bool(RE_WISH_AFTER.search(text) or RE_WISH_BEFORE.search(text))


def is_permanent_wish_pool(card: dict) -> bool:
    get_value = get_raw_get_field(card).strip()
    if not get_value:
        return False
    if get_value in {"常驻", "许愿"}:
        return True
    return has_standalone_wish_segment(get_value)


def is_limited_wish_pool(card: dict) -> bool:
    permanent_flag = (card.get("permanent") or "").strip()
    if permanent_flag:
        return False
    raw_get = get_raw_get_field(card)
    return "限时许愿" in raw_get


def ensure_pool_category_structure() -> dict:
    base = deepcopy(DEFAULT_POOL_CATEGORIES)
    for cat in base.values():
        if "subcategories" in cat:
            for sub in cat["subcategories"].values():
                sub["pools"] = []
        else:
            cat["pools"] = []
    return base


def get_category_priority(category_info: tuple[str, str | None]) -> int:
    return CATEGORY_PRIORITY.get(category_info, -1)


def classify_pool_category(card: dict) -> tuple[str, str | None]:
    if is_limited_wish_pool(card):
        return "wishSeries", "limited"
    if is_permanent_wish_pool(card):
        return "wishSeries", "permanent"
    return "specialRewards", None


def update_pool_categories_from_cards(cards: list[dict]) -> dict:
    def is_five_star(card_obj: dict) -> bool:
        star_value = (card_obj.get("star") or "").strip()
        return star_value.startswith("5")

    categories = ensure_pool_category_structure()
    pool_assignments: dict[str, tuple[str, str | None, int]] = {}
    pool_metadata: dict[str, dict] = {}

    for card in cards:
        if not is_five_star(card):
            continue
        raw_get_value = card.get("get", "")
        base_pool_name = extract_pool_name(raw_get_value)
        category_info = classify_pool_category(card)
        pool_name = base_pool_name
        if category_info == ("wishSeries", "limited"):
            quoted_name = extract_first_quote_name(raw_get_value)
            if quoted_name:
                pool_name = quoted_name
        elif category_info[0] == "specialRewards":
            pool_name = (card.get("name") or "").strip() or pool_name
        if not pool_name:
            continue

        meta = pool_metadata.setdefault(pool_name, {
            "characters": set(),
            "is_permanent": False,
        })
        character = (card.get("character") or "").strip()
        if character:
            meta["characters"].add(character)
        if category_info == ("wishSeries", "permanent"):
            meta["is_permanent"] = True

        priority = get_category_priority(category_info)
        previous = pool_assignments.get(pool_name)
        if previous and previous[2] >= priority:
            continue
        pool_assignments[pool_name] = (*category_info, priority)

    def build_pool_entry(name: str, meta: dict) -> dict:
        characters = meta.get("characters", set())
        role_count = len(characters)
        is_permanent_pool = meta.get("is_permanent", False)
        if is_permanent_pool:
            pool_type = "mixed"
        else:
            pool_type = "single" if role_count <= 1 else "mixed"
        return {
            "name": name,
            "poolType": pool_type,
            "roleCount": role_count,
            "isPermanent": is_permanent_pool,
        }

    for pool_name, info in pool_assignments.items():
        meta = pool_metadata.get(pool_name)
        if not meta:
            continue
        entry = build_pool_entry(pool_name, meta)
        cat_key, sub_key, _ = info
        if sub_key:
            categories[cat_key]["subcategories"].setdefault(sub_key, {"name": sub_key, "pools": []})
            categories[cat_key]["subcategories"][sub_key]["pools"].append(entry)
        else:
            categories[cat_key].setdefault("pools", [])
            categories[cat_key]["pools"].append(entry)

    with open(POOL_CATEGORIES_PATH, "w", encoding="utf-8") as fh:
        json.dump(categories, fh, ensure_ascii=False, indent=2)
    print(f"🎯 已更新 {POOL_CATEGORIES_PATH}，共写入 {len(pool_assignments)} 个卡池。", flush=True)

    return categories

# -----------------------------
# B 站分 P 支持
# -----------------------------
video_information_cache = {}

def fetch_bilibili_video_info(bvid: str) -> dict:
    if not bvid:
        return {}
    if bvid in video_information_cache:
        return video_information_cache[bvid]
    api = f"https://api.bilibili.com/x/web-interface/view?bvid={bvid}"
    try:
        resp = polite_get(api)
        data = resp.json()
        video_information_cache[bvid] = data
        return data
    except Exception as e:
        print(f"⚠️ Bilibili API 失败: {e}", flush=True)
        return {}

def find_dict_by_value(obj, target_value):
    if isinstance(obj, dict):
        for k, v in obj.items():
            if v == target_value:
                return obj
            got = find_dict_by_value(v, target_value)
            if got:
                return got
    elif isinstance(obj, list):
        for it in obj:
            got = find_dict_by_value(it, target_value)
            if got:
                return got
    return None

def build_player_url(src_tail_or_url: str, page_num: int | None) -> str:
    """
    把抓到的 iframe src 统一转成可外链的 bilibili 播放器 URL，并补常用参数。
    兼容传入是 '.html?后面的查询串'（形如 'bvid=...&p=...'）。
    """
    url = src_tail_or_url
    if url.startswith(("aid=", "bvid=", "p=")):
        url = "https://player.bilibili.com/player.html?" + url
    if url.startswith("//"):
        url = "https:" + url

    p = urlparse(url)
    qs = parse_qs(p.query)
    if page_num is not None:
        qs["p"] = [str(page_num)]
    qs.setdefault("autoplay", ["auto"])
    qs.setdefault("preload", ["auto"])
    qs.setdefault("quality", ["1080p"])
    qs["isOutside"] = ["true"]

    new_q = urlencode({k: v[-1] for k, v in qs.items()})
    return urlunparse(p._replace(query=new_q))

# -----------------------------
# MediaWiki 读取
# -----------------------------
_mw_site: mwclient.Site | None = None

def _get_mw_site(max_tries: int = 3) -> mwclient.Site | None:
    """
    初始化 mwclient.Site，带有限次数重试，避免瞬时网络抖动导致脚本崩溃。
    """
    global _mw_site
    if _mw_site is not None:
        return _mw_site

    for attempt in range(1, max_tries + 1):
        try:
            site = mwclient.Site(host="wiki.biligame.com", path="/lysk/", clients_useragent=UA)
            _mw_site = site
            return site
        except Exception as exc:
            wait = 2 * attempt
            print(
                f"⚠️ mwclient 初始化失败 {attempt}/{max_tries}：{exc}，{wait}s 后重试",
                flush=True,
            )
            time.sleep(wait)
    return None

def wiki_detailed_info(card_name: str) -> dict:
    """
    使用 mwclient 读取页面文本并解析字段。
    兼容模板行前导 '|'；失败返回 {}。
    """
    global _mw_site
    site = _get_mw_site()
    if site is None:
        return {}
    field_map = {
        "思念角色": "character",
        "思念名称": "name",
        "思念位置": "card_type_tag",
        "思念星谱": "card_color_tag",
        "思念星级": "star",
        "思念天赋": "talent",
        "思念获取途径": "get",
        "常驻": "permanent",
        "思念上线时间": "time",
    }
    max_tries = 5
    for i in range(1, max_tries + 1):
        try:
            page = site.pages[card_name]
            text = page.text() or ""
            info = {}
            for line in text.split("\n"):
                if "=" not in line:
                    continue
                k, v = line.split("=", 1)
                k = k.replace("|", "").strip()  # 关键：去掉管道符与空格
                v = v.strip()
                if k in field_map:
                    if k == "思念星级" and v and not v.endswith("星"):
                        v += "星"
                    info[field_map[k]] = v
            return info
        except Exception as e:
            print(f"⚠️ mwclient 获取失败 {card_name} ({i}/{max_tries}): {e}", flush=True)
            time.sleep(2 * i)
            _mw_site = None  # 强制下一轮重新初始化连接
            site = _get_mw_site()
            if site is None:
                break
    return {}

def is_card_data_complete(card: dict) -> bool:
    required = ["character", "name", "star", "card_color_tag", "card_type_tag", "talent", "get", "time"]
    return all(card.get(f) for f in required)

# -----------------------------
# 详情页解析
# -----------------------------
def fetch_detail_image(detail_url: str, card_name: str, max_retry: int = 3):
    """
    返回：small_img, big_img, video_url
    - 不下载文件
    - 兼容 iframe 被转义成文本
    - 尽量匹配分 P
    - 支持自动重试（默认最多 3 次）
    """
    small_img = big_img = video_url = ""

    for attempt in range(1, max_retry + 1):
        try:
            res = polite_get(detail_url)
            soup = BeautifulSoup(res.content, "html.parser")

            # 图片：只引用链接，不拼直链
            img = soup.select_one(".center img") or soup.select_one("img")
            if img:
                src = img.get("src", "") or ""
                srcset = img.get("srcset", "") or ""
                big_img = parse_best_from_srcset(srcset) or src
                small_img = src

            # 视频：用原始 bytes/转义文本兜底抓 <iframe>
            blocks = extract_iframes(res.content)
            if blocks:
                m = IFRAME_SRC_RE.search(blocks[0])
                raw_src = m.group(1) if m else ""
                if raw_src:
                    # 提取 bvid 并尽可能匹配分 P
                    bvid = ""
                    try:
                        q = parse_qs(urlparse(raw_src).query)
                        bvid = (q.get("bvid") or [""])[0]
                    except Exception:
                        pass

                    page_num = None
                    if bvid:
                        data = fetch_bilibili_video_info(bvid)
                        hit = find_dict_by_value(data, card_name)
                        if hit:
                            page_num = hit.get("page")

                    # 兼容 '.html?xxx' 尾巴
                    tail_or_url = raw_src.split(".html?")[-1] if ".html?" in raw_src else raw_src
                    video_url = build_player_url(tail_or_url, page_num)
                    print(video_url, flush=True)

            # 成功则直接返回
            return small_img, big_img, video_url

        except Exception as e:
            print(f"❌ 第 {attempt} 次获取详情页失败：{detail_url}，错误：{e}", flush=True)
            if attempt < max_retry:
                print(f"🔁 {1 if max_retry - attempt == 1 else max_retry - attempt} 次重试剩余，等待 1 秒后重试...", flush=True)
                time.sleep(1)
            else:
                print("🚫 已达到最大重试次数，放弃重试。", flush=True)

    # 全部失败则返回空结果
    return small_img, big_img, video_url

# -----------------------------
# 主流程
# -----------------------------
def main():
    print("🚀 开始爬取：", ENTRY_URL, flush=True)
    all_cards = []

    # 入口页
    entry = polite_get(ENTRY_URL)
    soup = BeautifulSoup(entry.text, "html.parser")
    boxes = soup.select("div.divsort") or []
    print(f"共发现卡片：{len(boxes)}", flush=True)

    for idx, box in enumerate(boxes, 1):
        name_el = box.select_one(".card-name")
        if not name_el:
            continue
        card_name = name_el.text.strip()
        print(f"{idx}. {card_name}", flush=True)

        # 基础信息（mwclient）
        info = wiki_detailed_info(card_name)

        # 详情链接
        detail_a = box.select_one(".card-img a")
        detail_url = urljoin(WIKI_BASE, detail_a.get("href")) if (detail_a and detail_a.get("href")) else ""

        # 列表中的小图（兜底）
        list_small = ""
        img_in_list = box.select_one("a.image img")
        if img_in_list:
            list_small = parse_best_from_srcset(img_in_list.get("srcset", "") or "") or img_in_list.get("src", "") or ""

        # 详情页图片/视频
        small_img = big_img = video_url = ""
        if detail_url:
            small_img, big_img, video_url = fetch_detail_image(detail_url, card_name)

        # 字段完整性重试（最多 3 次）
        tries = 0
        while not is_card_data_complete(info) and tries < 3:
            print(f"  ↺ 字段不全，重试 {tries+1}/3：{card_name}", flush=True)
            time.sleep(2)
            info = wiki_detailed_info(card_name)
            tries += 1

        # 最终图链接
        final_small = small_img or list_small or ""
        final_big = big_img or final_small

        # 汇总
        info["image_small"] = final_small
        info["image"] = final_big
        info["video_url"] = video_url

        all_cards.append(info)


    # with Path(CARDS_PATH).open("r", encoding="utf-8") as fh:
    #     all_cards = json.load(fh)

    # 卡池分类
    update_pool_categories_from_cards(all_cards)

    # 保存
    with open(CARDS_PATH, "w", encoding="utf-8") as f:
        json.dump(all_cards, f, ensure_ascii=False, indent=2)

    print(f"✅ 完成，共保存 {len(all_cards)} 条，输出：{CARDS_PATH}", flush=True)

if __name__ == "__main__":
    main()
