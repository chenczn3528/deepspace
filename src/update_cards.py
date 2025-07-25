from bs4 import BeautifulSoup, Tag
from urllib.parse import urljoin, unquote
import json
import time
import mwclient
import requests
import re

cards_path = 'src/assets/cards.json'

urls = [
    "https://wiki.biligame.com/lysk/%E6%B2%88%E6%98%9F%E5%9B%9E:%E6%80%9D%E5%BF%B5",
    "https://wiki.biligame.com/lysk/%E9%BB%8E%E6%B7%B1:%E6%80%9D%E5%BF%B5",
    "https://wiki.biligame.com/lysk/%E7%A5%81%E7%85%9C:%E6%80%9D%E5%BF%B5",
    "https://wiki.biligame.com/lysk/%E7%A7%A6%E5%BD%BB:%E6%80%9D%E5%BF%B5",
    "https://wiki.biligame.com/lysk/%E5%A4%8F%E4%BB%A5%E6%98%BC:%E6%80%9D%E5%BF%B5"
]

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
}

def extract_iframes(html) -> list:
    """
    从HTML中提取所有完整的<iframe>标签块，支持str或bytes输入

    参数:
        html (str or bytes): 原始HTML内容

    返回:
        List[str]: 所有<iframe>标签块的列表
    """
    if isinstance(html, bytes):
        html = html.decode('utf-8', errors='ignore')  # 可根据实际编码修改

    pattern = r'<iframe.*?</iframe>'
    return re.findall(pattern, html, re.DOTALL | re.IGNORECASE)



video_infomation = {}

def fetch_bilibili_video_info(bvid: str) -> dict:
    """
    请求 Bilibili 视频信息 API，获取指定 BV 号的视频数据

    参数:
        bvid (str): 视频的 BV 号，例如 'BV1W6421Z7NZ'

    返回:
        dict: 视频信息的 JSON 数据（如请求失败则返回空字典）
    """
    url = f"https://api.bilibili.com/x/web-interface/view?bvid={bvid}"
    headers = {
        "User-Agent": "Mozilla/5.0"
    }

    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"请求失败: {e}")
        return {}


def find_dict_by_value(obj, target_value):
    """
    递归查找字典中值为 target_value 的字段，返回该字段所在的父级字典
    """
    if isinstance(obj, dict):
        for key, value in obj.items():
            if value == target_value:
                return obj
            result = find_dict_by_value(value, target_value)
            if result:
                return result
    elif isinstance(obj, list):
        for item in obj:
            result = find_dict_by_value(item, target_value)
            if result:
                return result
    return None


# 获取清晰图
def extract_biggest_img_from_srcset(srcset):
    if not srcset:
        return ""
    parts = [p.strip() for p in srcset.split(",")]
    for part in reversed(parts):
        if part.endswith("2x"):
            return part.split(" ")[0]
    return parts[-1].split(" ")[0] if parts else ""

# 获取详情页的大图和小图
def fetch_detail_image(card_url, card_name):
    try:
        res = requests.get(card_url, headers=headers)
        soup = BeautifulSoup(res.content, "html.parser")
        img = soup.select_one(".center img")

        video = extract_iframes(res.content)
        video_url = ""
        if len(video) != 0:
            video_url = video[0].split(".html?")[1].split("\"")[0]
            bvid = video_url.split("bvid=")[-1].split("&")[0]
            if bvid not in video_infomation.keys():
                result = fetch_bilibili_video_info(bvid)
                video_infomation[bvid] = result
            page = find_dict_by_value(video_infomation[bvid], card_name)
            video_url = video_url.replace("p=&", "p=" + str(page.get("page")) + "&").replace("autoplay=0", "autoplay=auto")
            video_url = "https://player.bilibili.com/player.html?isOutside=true&" + video_url + "&preload=auto&quality=1080p"
            print(video_url)

        if img:
            src = img.get("src", "")
            srcset = img.get("srcset", "")
            biggest_srcset = extract_biggest_img_from_srcset(srcset)
            if biggest_srcset == "":
                biggest_srcset = src
            return src, biggest_srcset, video_url
        else:
            print(card_url, flush=True)
            return "", "", ""
    except Exception as e:
        print(f"❌ 获取详情页失败：{card_url}，错误：{e}", flush=True)
        return "", "", ""



# 用wiki API获取其他详细信息
def wiki_detailed_info(card_name):

    max_tries = 5

    for i in range(max_tries):
        try:
            # 连接到 BWIKI
            site = mwclient.Site('wiki.biligame.com', path='/lysk/')

            # 指定页面名
            page = site.pages[card_name]  # 页面标题不需要编码（会自动处理）

            # 获取文本内容
            text = page.text()

            info_dict = {}

            field_map = {
                "思念角色": "character",
                "思念名称": "name",
                "思念位置": "card_type_tag",
                "思念星谱": "card_color_tag",
                "思念星级": "star",
                "思念天赋": "talent",
                "思念获取途径": "get",
                "常驻": "permanent",
                "思念上线时间": "time"
            }

            for line in text.split("\n"):
                for key, var in field_map.items():
                    if key in line:
                        value = line.split("=", 1)[-1].strip()
                        if key == "思念星级":
                            value += "星"
                        info_dict[var] = value
            return info_dict
        except Exception as e:
            print(e, flush=True)
            time.sleep(5)
            if i == max_tries - 1:
                print(card_name, flush=True)
                return None


def is_card_data_complete(card_data):
    """检查卡片数据是否完整"""
    required_fields = ["character", "name", "star", "card_color_tag", "card_type_tag", "talent", "get", "time"]
    return all(card_data.get(field) for field in required_fields)


all_cards = []
count = 0

for url in urls:
    res = requests.get(url, headers=headers)
    soup = BeautifulSoup(res.content, "html.parser")

    card_boxes = soup.select("div.card-Item-box")

    for box in card_boxes:

        # 获取卡名
        card_a = box.select_one("a[title]")
        card_name = card_a["title"] if card_a else "未知"

        new_card_data = wiki_detailed_info(card_name)

        print(count + 1, card_name, flush=True)
        count += 1

        detail_href = card_a["href"] if card_a and "href" in card_a.attrs else ""
        detail_url = urljoin(url, detail_href) if detail_href else ""

        for icon in box.select("a.image"):
            img_tag = icon.find("img")
            if not img_tag:
                continue
            img_url = extract_biggest_img_from_srcset(img_tag.get("srcset", ""))

        small_card_image, card_image, video_url = fetch_detail_image(detail_url, card_name) if detail_url else ""

        attempt_count = 0
        while not is_card_data_complete(new_card_data) or not (small_card_image or card_image):
            if attempt_count > 5:
                break
            if card_name.startswith("文件:思念图标"):
                new_card_data = wiki_detailed_info(card_name.split("文件:思念图标-")[-1].replace(".png", ""))
                small_card_image, card_image, video_url = fetch_detail_image(detail_url, card_name) if detail_url else ""
                break
            else:
                print(f"❌ 卡片 {card_name} 信息不完整，重新爬取... ", flush=True)
                time.sleep(5)  # 等待一段时间后重试
                new_card_data = wiki_detailed_info(card_name)
                small_card_image, card_image, video_url = fetch_detail_image(detail_url, card_name) if detail_url else ""

        if card_name.startswith("文件:思念图标"):
            new_card_data["image"] = ""
            new_card_data["image_small"] = ""
            new_card_data["video_url"] = ""
        else:
            new_card_data["image_small"] = small_card_image
            new_card_data["image"] = card_image.replace("thumb", "").split('.png')[0] + ".png?download"
            new_card_data["video_url"] = video_url

        all_cards.append(new_card_data)
        time.sleep(0.2)


# 保存更新后的 JSON 文件
with open(cards_path, "w", encoding="utf-8") as f:
    json.dump(all_cards, f, ensure_ascii=False, indent=2)

print(f"✅ 共提取 {len(all_cards)} 张卡片信息，已保存为 {cards_path}", flush=True)
