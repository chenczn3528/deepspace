import json
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from bs4 import BeautifulSoup
import time

songs_json_path = "src/assets/songs.json"
songs_list_path = "src/assets/songs_list.json"




import chromedriver_autoinstaller  # 顶部引入

def create_driver():
    chromedriver_autoinstaller.install()  # 自动下载并安装匹配的 chromedriver

    chrome_options = Options()
    chrome_options.binary_location = "/usr/bin/google-chrome"
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")

    return webdriver.Chrome(options=chrome_options)






def get_albums(driver, artist_id):
    artist_url = f"https://music.163.com/artist/album?id={artist_id}&limit=1000"

    driver.set_page_load_timeout(30)  # 最多等 30 秒加载页面
    try:
        driver.get(artist_url)
    except Exception as e:
        print("页面加载失败:", e, flush=True)
        return []

    try:
        WebDriverWait(driver, 20).until(EC.frame_to_be_available_and_switch_to_it((By.ID, "g_iframe")))
    except Exception as e:
        print("iframe 加载失败:", e, flush=True)
        return []

    # # 切换到 iframe
    # driver.switch_to.frame("g_iframe")
    # time.sleep(2)

    soup = BeautifulSoup(driver.page_source, "html.parser")

    albums = []

    for li in soup.select("ul#m-song-module li"):
        a_tag = li.select_one("a.msk")
        if not a_tag:
            continue
        href = a_tag.get("href", "")
        album_id = href.split("id=")[-1] if "id=" in href else None

        title = li.select_one("p.dec a.tit")
        if title:
            album_title = title.text.strip()
        else:
            album_title = li.select_one("div.u-cover")["title"] if li.select_one("div.u-cover") else "未知专辑"

        if album_id:
            albums.append((album_id, album_title))

    driver.switch_to.default_content()  # 记得切回默认内容，方便下次调用
    return albums

def get_songs(driver, album_id, album_title):
    album_url = f"https://music.163.com/album?id={album_id}&limit=1000"

    driver.set_page_load_timeout(30)  # 最多等 30 秒加载页面
    try:
        driver.get(album_url)
    except Exception as e:
        print("页面加载失败:", e, flush=True)
        return []

    try:
        WebDriverWait(driver, 20).until(EC.frame_to_be_available_and_switch_to_it((By.ID, "g_iframe")))
    except Exception as e:
        print("iframe 加载失败:", e, flush=True)
        return []

    soup = BeautifulSoup(driver.page_source, "html.parser")

    songs = []

    table = soup.find('table', class_='m-table m-table-album')
    trs = table.tbody.find_all('tr')

    print(f"共找到{len(trs)}行歌曲数据，专辑：{album_title}")

    for tr in trs:
        song_id = tr.get('id')
        title_tag = tr.find('b')
        title = title_tag['title'] if title_tag and title_tag.has_attr('title') else None

        duration_tag = tr.find('td', class_='s-fc3')
        duration = duration_tag.find('span', class_='u-dur').text if duration_tag else None

        last_td = tr.find_all('td')[-1]
        singer_div = last_td.find('div', class_='text')
        singers = singer_div['title'] if singer_div and singer_div.has_attr('title') else None

        songs.append({
            "id": song_id,
            "title": title,
            "duration": duration,
            "singers": singers
        })

    driver.switch_to.default_content()
    return songs



def ensure_id_exists(data_list, target_id, default_obj):
    # 判断是否已有目标 id
    if not any(item.get("id") == target_id for item in data_list):
        data_list.append(default_obj)
    return data_list



if __name__ == "__main__":
    driver = create_driver()
    try:
        final_results = {}
        albums = get_albums(driver, "59642824")
        print(f"共找到 {len(albums)} 张专辑：", flush=True)
        for album_id, album_title in albums:
            print(f"\n{album_id} : {album_title}", flush=True)
            songs = get_songs(driver, album_id, album_title)
            final_results[album_id] = {
                "name": album_title,
                "songs": songs
            }

        with open(songs_json_path, "w", encoding="utf-8") as f:
            json.dump(final_results, f, ensure_ascii=False, indent=4)

        songs_list = []
        for key, value in final_results.items():
            for song in value["songs"]:
                songs_list.append(song)

        ensure_id_exists(songs_list, "26996410931750205807385", {
            "id": "26996410931750205807385",
            "title": "春天对花所做的事",
            "duration": "03:57",
            "singers": ""
        })

        print(len(songs_list))
        for i in songs_list:
            print(i)

        with open(songs_list_path, "w", encoding="utf-8") as f:
            json.dump(songs_list, f, ensure_ascii=False, indent=4)

    finally:
        driver.quit()


# final_results = {}
# albums = get_albums("59642824")
# print(f"共找到 {len(albums)} 张专辑：")
# for album_id, album_title in albums:
#     print(f"\n{album_id} : {album_title}")
#     songs = get_songs(album_id, album_title)
#     final_results[album_id] = {
#         "name": album_title,
#         "songs": songs
#     }
#
# with open("assets/songs.json", "w", encoding="utf-8") as f:
#     json.dump(final_results, f, ensure_ascii=False, indent=4)
#
#
# songs_list = []
# with open("assets/songs.json", "r", encoding="utf-8") as f:
#     final_results = json.load(f)
#     for key, value in final_results.items():
#         for song in value["songs"]:
#             songs_list.append(song)



# ensure_id_exists(songs_list, "26996410931750205807385", {
#     "id": "26996410931750205807385",
#     "title": "春天对花所做的事",
#     "duration": "03:57",
#     "singers": ""
# })
#
# print(len(songs_list))
# for i in songs_list:
#     print(i)
#
# with open("assets/songs_list.json", "w", encoding="utf-8") as f:
#     json.dump(songs_list, f, ensure_ascii=False, indent=4)