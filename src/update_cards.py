# -*- coding: utf-8 -*-
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
WIKI_BASE = "https://wiki.biligame.com/lysk/"
ENTRY_URL = WIKI_BASE + "%E6%80%9D%E5%BF%B5:%E7%AD%9B%E9%80%89"

# 统一许可
LICENSE_NAME = "CC BY-NC-SA 4.0"
LICENSE_URL = "https://creativecommons.org/licenses/by-nc-sa/4.0/"

UA = "GachaSimCrawler/1.0 (+mailto:chenczn3528@gmail.com)"  # 合规 UA
HEADERS = {"User-Agent": UA}

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
def fetch_detail_image(detail_url: str, card_name: str):
    """
    返回：small_img, big_img, video_url
    - 不下载文件
    - 兼容 iframe 被转义成文本
    - 尽量匹配分 P
    """
    small_img = big_img = video_url = ""
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

    except Exception as e:
        print(f"❌ 获取详情页失败：{detail_url}，错误：{e}", flush=True)

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

    # 保存
    with open(CARDS_PATH, "w", encoding="utf-8") as f:
        json.dump(all_cards, f, ensure_ascii=False, indent=2)

    print(f"✅ 完成，共保存 {len(all_cards)} 条，输出：{CARDS_PATH}", flush=True)

if __name__ == "__main__":
    main()
