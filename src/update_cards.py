import requests
from bs4 import BeautifulSoup, Tag
from urllib.parse import urljoin, unquote
import json
import re
import time
import os


cards_path = 'src/assets/cards.json'

urls = [
    "https://wiki.biligame.com/lysk/%E6%B2%88%E6%98%9F%E5%9B%9E:%E6%80%9D%E5%BF%B5",
    "https://wiki.biligame.com/lysk/%E9%BB%8E%E6%B7%B1:%E6%80%9D%E5%BF%B5",
    "https://wiki.biligame.com/lysk/%E7%A5%81%E7%85%9C:%E6%80%9D%E5%BF%B5",
    "https://wiki.biligame.com/lysk/%E7%A7%A6%E5%BD%BB:%E6%80%9D%E5%BF%B5",
    "https://wiki.biligame.com/lysk/%E5%A4%8F%E4%BB%A5%E6%98%BC:%E6%80%9D%E5%BF%B5"
]

# 绿蓝紫黄红粉
TARGET_ALTS = ["蓝弧", "红漪", "紫辉", "粉珀", "绿珥", "黄璃"]

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
}

# 获取角色名
def extract_character_from_url(url):
    decoded = unquote(url.split("/")[-1])
    return decoded.split(":")[0] if ":" in decoded else decoded

# 获取星级
def extract_star_from_img_src(src_url):
    decoded_url = unquote(src_url)
    match = re.search(r"-([345])星\.png", decoded_url)
    return f"{match.group(1)}星" if match else "未知"

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
def fetch_detail_image(card_url):
    try:
        res = requests.get(card_url, headers=headers)
        soup = BeautifulSoup(res.content, "html.parser")
        img = soup.select_one(".center img")

        if img:
            src = img.get("src", "")
            srcset = img.get("srcset", "")
            biggest_srcset = extract_biggest_img_from_srcset(srcset)
            if biggest_srcset == "":
                biggest_srcset = src
            return src, biggest_srcset
        else:
            print(card_url)
            return "", ""
    except Exception as e:
        print(f"❌ 获取详情页失败：{card_url}，错误：{e}")
        return "", ""



def is_card_data_complete(card_data):
    """检查卡片数据是否完整"""
    required_fields = ["character", "name", "star", "image", "image_small", "card_color", "card_color_tag", "card_type", "card_type_tag", "card_star_icon",
                       "detail_url"]
    return all(card_data.get(field) for field in required_fields)



# 获取星谱颜色
def find_nearest_color_tag(box: Tag) -> str:
    # 向上查找前一个 tag，直到找到 alt 在指定列表中的 img
    current = box.previous_element
    while current:
        if isinstance(current, Tag) and current.name == "img":
            alt_text = current.get("alt", "")
            for target in TARGET_ALTS:
                if target in alt_text:
                    return target
        current = current.previous_element
    return "未知"


all_cards = []
count = 0

for url in urls:
    res = requests.get(url, headers=headers)
    soup = BeautifulSoup(res.content, "html.parser")
    character_name = extract_character_from_url(url)

    card_boxes = soup.select("div.card-Item-box")

    for box in card_boxes:

        # 查找星谱名
        color_tag = find_nearest_color_tag(box)

        card_a = box.select_one("a[title]")
        card_name = card_a["title"] if card_a else "未知"

        print(count + 1, card_name)
        count += 1

        detail_href = card_a["href"] if card_a and "href" in card_a.attrs else ""
        detail_url = urljoin(url, detail_href) if detail_href else ""

        card_color = card_type = card_star_icon = ""
        for icon in box.select("a.image"):
            title = icon.get("title", "")
            img_tag = icon.find("img")
            if not img_tag:
                continue
            img_url = extract_biggest_img_from_srcset(img_tag.get("srcset", ""))
            if title == "card-color":
                card_color = img_url
            elif title == "card-type":
                card_type = img_url
            elif title == "card-star":
                card_star_icon = img_url

        star = extract_star_from_img_src(card_star_icon)

        small_card_image, card_image = fetch_detail_image(detail_url) if detail_url else ""

        card_type_tag = ""
        card_type_decoded = unquote(card_type)
        if "日冕" in card_type_decoded:
            card_type_tag = "日冕"
        elif "月晖" in card_type_decoded:
            card_type_tag = "月晖"

        # attempt_count = 0
        while not is_card_data_complete({
            "character": character_name,
            "name": card_name,
            "star": star,
            "image": card_image,
            "image_small": small_card_image,
            "card_color": card_color,
            "card_color_tag": color_tag,
            "card_type": card_type,
            "card_type_tag": card_type_tag,
            "card_star_icon": card_star_icon,
            "detail_url": detail_url
        }) :
            print(f"❌ 卡片 {card_name} 信息不完整，重新爬取... ")
            time.sleep(5)  # 等待一段时间后重试
            small_card_image, card_image = fetch_detail_image(detail_url) if detail_url else ""

        new_card_data = {
            "character": character_name,
            "name": card_name,
            "star": star,
            "image": card_image.replace("thumb", "").split('.png')[0] + ".png?download",
            "image_small": small_card_image,
            "card_color": card_color,
            "card_color_tag": color_tag,
            "card_type": card_type,
            "card_type_tag": card_type_tag,
            "card_star_icon": card_star_icon.replace("81px", "200px"),
            "detail_url": detail_url
        }

        all_cards.append(new_card_data)
        time.sleep(0.2)


# 保存更新后的 JSON 文件
with open(cards_path, "w", encoding="utf-8") as f:
    json.dump(all_cards, f, ensure_ascii=False, indent=2)

print(f"✅ 共提取 {len(all_cards)} 张卡片信息，已保存为 {cards_path}")
