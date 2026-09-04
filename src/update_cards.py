# -*- coding: utf-8 -*-
from __future__ import annotations
from pathlib import Path

"""
恋与深空 WIKI 抽卡卡片爬虫
----------------------------------------------------------------
- 仅保存图片链接与视频信息（Bvid / Pname），不下载文件
- 礼貌 UA、限速、Session+Retry
- 解析脚本内的 B 站视频信息
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
from urllib.parse import urljoin, urlencode
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
UA_POOL = [
    UA,
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
]
HEADERS = {
    "User-Agent": UA,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    "Referer": WIKI_BASE,
}

BILI_ORIGIN = "https://www.bilibili.com"
BILI_VIDEO_PREFIX = "https://www.bilibili.com/video/"

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

def polite_get(
    url: str,
    timeout: int = 15,
    max_retry: int = 3,
    headers: dict[str, str] | None = None,
    retry_statuses: set[int] | None = None,
) -> requests.Response:
    """带随机延迟的 GET，避免给站点造成压力。遇到拦截状态码会重试。"""
    last_exc = None
    retry_statuses = retry_statuses or {403, 429, 567}
    for attempt in range(1, max_retry + 1):
        time.sleep(1.5 + random.random())  # 1.5~2.5s
        request_headers = dict(HEADERS)
        request_headers["User-Agent"] = random.choice(UA_POOL)
        if headers:
            request_headers.update(headers)
        try:
            resp = session.get(url, timeout=timeout, headers=request_headers)
            if resp.status_code in retry_statuses and attempt < max_retry:
                wait = 2 * attempt
                print(f"⚠️ HTTP {resp.status_code}，{wait}s 后重试 ({attempt}/{max_retry})", flush=True)
                time.sleep(wait)
                continue
            resp.raise_for_status()
            if not resp.encoding:
                resp.encoding = resp.apparent_encoding or "utf-8"
            return resp
        except Exception as exc:
            last_exc = exc
            if attempt < max_retry:
                wait = 2 * attempt
                print(f"⚠️ 请求失败 {attempt}/{max_retry}：{exc}，{wait}s 后重试", flush=True)
                time.sleep(wait)
                continue
            raise
    raise last_exc


def build_bili_headers(bvid: str) -> dict[str, str]:
    return {
        "Accept": "application/json, text/plain, */*",
        "Origin": BILI_ORIGIN,
        "Referer": f"{BILI_VIDEO_PREFIX}{bvid}",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-site",
    }

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

# —— 从脚本里解析 B 站视频信息（Bvid / Pname）
BILI_BVID_RE = re.compile(r"\b(?:Bvid|bv)\b\s*=\s*[`'\"](?P<bvid>BV[0-9A-Za-z]+)[`'\"]")
BILI_PNAME_RE = re.compile(r"\b(?:Pname|pname)\b\s*=\s*[`'\"](?P<pname>[^`'\"]+)[`'\"]")
WIKI_LINK_RE = re.compile(r"\[\[([^\]]+)\]\]")
FULL_WIDTH_BRACKET_RE = re.compile(r"【([^】]+)】")
QUOTE_NAME_RE = re.compile(r"「([^」]+)」")
EVENT_GAIN_RE = re.compile(r"^在?(.+?)活动中获取$")

def extract_bili_script_info(html_bytes_or_text) -> tuple[str, str]:
    """
    从原始 HTML（bytes 或 str）提取 Bvid 与 Pname（卡片分 P 名称）。
    支持脚本内的 `const Bvid = ...; const Pname = ...;` 等写法。
    """
    if isinstance(html_bytes_or_text, bytes):
        raw = html_bytes_or_text.decode("utf-8", errors="ignore")
    else:
        raw = html_bytes_or_text or ""

    candidates = [raw]
    unescaped = html.unescape(raw)
    if unescaped != raw:
        candidates.append(unescaped)

    for text in candidates:
        bvid_match = BILI_BVID_RE.search(text)
        pname_match = BILI_PNAME_RE.search(text)
        bvid = bvid_match.group("bvid") if bvid_match else ""
        pname = pname_match.group("pname").strip() if pname_match else ""
        if bvid or pname:
            return bvid, pname

    return "", ""


def normalize_event_pool_name(name: str) -> str:
    match = EVENT_GAIN_RE.match(name)
    if match:
        return match.group(1).strip()
    return name


def normalize_part_name(value: str) -> str:
    if not value:
        return ""
    text = str(value).lower()
    text = re.sub(r"\s+", "", text)
    return re.sub(r"[【】「」\[\]（）()《》〈〉·•、，。？！!?:;\"'“”\-_.]", "", text)


def fetch_bilibili_page(bvid: str, pname: str) -> int | None:
    if not bvid:
        return None
    api = f"https://api.bilibili.com/x/web-interface/view?bvid={bvid}"
    try:
        resp = polite_get(api, headers=build_bili_headers(bvid), retry_statuses={403, 412, 429, 567})
        data = resp.json() or {}
        pages = (data.get("data") or {}).get("pages") or []
        if not pages:
            return None
        if not pname:
            return int(pages[0].get("page") or 1)
        target = pname.strip()
        hit = next((p for p in pages if p.get("part") == target), None)
        if not hit:
            norm_target = normalize_part_name(target)
            hit = next((p for p in pages if normalize_part_name(p.get("part")) == norm_target), None)
        if not hit:
            norm_target = normalize_part_name(target)
            hit = next((p for p in pages if norm_target in normalize_part_name(p.get("part"))), None)
        if not hit:
            norm_target = normalize_part_name(target)
            hit = next((p for p in pages if normalize_part_name(p.get("part")) in norm_target), None)
        return int(hit.get("page") or 1) if hit else None
    except Exception as e:
        print(f"⚠️ Bilibili API 失败: {e}", flush=True)
        return None


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
# MediaWiki 读取
# -----------------------------
_mw_site: mwclient.Site | None = None
_mw_site_unavailable = False

def _get_mw_site(max_tries: int = 3) -> mwclient.Site | None:
    """
    初始化 mwclient.Site，带有限次数重试，避免瞬时网络抖动导致脚本崩溃。
    """
    global _mw_site, _mw_site_unavailable
    if _mw_site_unavailable:
        return None
    if _mw_site is not None:
        return _mw_site

    for attempt in range(1, max_tries + 1):
        try:
            site = mwclient.Site(
                host="wiki.biligame.com",
                path="/lysk/",
                clients_useragent=random.choice(UA_POOL),
            )
            _mw_site = site
            return site
        except Exception as exc:
            wait = 2 * attempt
            print(
                f"⚠️ mwclient 初始化失败 {attempt}/{max_tries}：{exc}，{wait}s 后重试",
                flush=True,
            )
            time.sleep(wait)
    _mw_site_unavailable = True
    return None

def fetch_wiki_text_via_api(card_name: str) -> str:
    params = {
        "action": "query",
        "prop": "revisions",
        "rvprop": "content",
        "rvslots": "main",
        "format": "json",
        "titles": card_name,
    }
    api_url = f"{WIKI_BASE}api.php?{urlencode(params)}"
    try:
        resp = polite_get(api_url)
        data = resp.json() or {}
        pages = (data.get("query") or {}).get("pages") or {}
        for _, page in pages.items():
            revisions = page.get("revisions") or []
            if not revisions:
                continue
            rev = revisions[0]
            slots = rev.get("slots") or {}
            main = slots.get("main") or {}
            text = main.get("*") or rev.get("*")
            if text:
                return text
    except Exception as exc:
        print(f"⚠️ api.php 获取失败 {card_name}: {exc}", flush=True)
    return ""

def wiki_detailed_info(card_name: str) -> dict:
    """
    使用 mwclient 读取页面文本并解析字段。
    兼容模板行前导 '|'；失败返回 {}。
    """
    global _mw_site, _mw_site_unavailable
    site = _get_mw_site()
    if site is None:
        text = fetch_wiki_text_via_api(card_name)
        if not text:
            return {}
        return parse_wiki_text(text)
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
            return parse_wiki_text(text)
        except Exception as e:
            print(f"⚠️ mwclient 获取失败 {card_name} ({i}/{max_tries}): {e}", flush=True)
            time.sleep(2 * i)
            _mw_site = None  # 强制下一轮重新初始化连接
            site = _get_mw_site()
            if site is None:
                _mw_site_unavailable = True
                text = fetch_wiki_text_via_api(card_name)
                if not text:
                    break
                return parse_wiki_text(text)
    return {}

def parse_wiki_text(text: str) -> dict:
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
    info = {}
    for line in text.split("\n"):
        if "=" not in line:
            continue
        k, v = line.split("=", 1)
        k = k.replace("|", "").strip()
        v = v.strip()
        if k in field_map:
            if k == "思念星级" and v and not v.endswith("星"):
                v += "星"
            info[field_map[k]] = v
    return info

def is_card_data_complete(card: dict) -> bool:
    required = ["character", "name", "star", "card_color_tag", "card_type_tag", "talent", "get", "time"]
    return all(card.get(f) for f in required)

# -----------------------------
# 详情页解析
# -----------------------------
def fetch_detail_image(detail_url: str, card_name: str, max_retry: int = 3):
    """
    返回：small_img, big_img, video_bvid, video_page
    - 不下载文件
    - 解析脚本内的 Bvid / Pname
    - 支持自动重试（默认最多 3 次）
    """
    small_img = big_img = video_bvid = ""
    video_page = None

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

            # 视频：从脚本中解析 Bvid / Pname
            video_bvid, video_pname = extract_bili_script_info(res.content)
            if video_bvid:
                video_page = fetch_bilibili_page(video_bvid, video_pname) or 1

            # 成功则直接返回
            return small_img, big_img, video_bvid, video_page

        except Exception as e:
            print(f"❌ 第 {attempt} 次获取详情页失败：{detail_url}，错误：{e}", flush=True)
            if attempt < max_retry:
                print(f"🔁 {1 if max_retry - attempt == 1 else max_retry - attempt} 次重试剩余，等待 1 秒后重试...", flush=True)
                time.sleep(1)
            else:
                print("🚫 已达到最大重试次数，放弃重试。", flush=True)

    # 全部失败则返回空结果
    return small_img, big_img, video_bvid, video_page

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
        small_img = big_img = video_bvid = ""
        video_page = None
        if detail_url:
            small_img, big_img, video_bvid, video_page = fetch_detail_image(detail_url, card_name)

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
        info["video_bvid"] = video_bvid
        info["video_page"] = video_page

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
