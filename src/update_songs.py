import json
from selenium import webdriver
from bs4 import BeautifulSoup
import time

def get_albums(id):
    artist_url = f"https://music.163.com/#/artist/album?id={id}&limit=1000"

    driver = webdriver.Chrome()
    driver.get(artist_url)

    time.sleep(3)   # 等待页面加载，确保 iframe 内容渲染完毕

    # 切换到 iframe
    driver.switch_to.frame("g_iframe")
    time.sleep(2)

    # 获取页面源代码并解析
    soup = BeautifulSoup(driver.page_source, "html.parser")

    albums = []

    # 找到所有li元素
    for li in soup.select("ul#m-song-module li"):
        # 专辑链接在 <a class="msk"> 中的 href
        a_tag = li.select_one("a.msk")
        if not a_tag:
            continue
        href = a_tag.get("href", "")
        # href格式 /album?id=专辑id
        album_id = href.split("id=")[-1] if "id=" in href else None

        # 专辑标题可以从 <div> 的 title 或 <p> 中拿
        title = li.select_one("p.dec a.tit")
        if title:
            album_title = title.text.strip()
        else:
            album_title = li.select_one("div.u-cover")["title"] if li.select_one("div.u-cover") else "未知专辑"

        if album_id:
            albums.append((album_id, album_title))

    driver.quit()
    return albums

def get_songs(id, album):
    album_url = f"https://music.163.com/#/album?id={id}&limit=1000"

    driver = webdriver.Chrome()
    driver.get(album_url)

    time.sleep(3)  # 等待页面加载，确保 iframe 内容渲染完毕

    # 切换到 iframe
    driver.switch_to.frame("g_iframe")
    time.sleep(2)

    # 获取页面源代码并解析
    soup = BeautifulSoup(driver.page_source, "html.parser")

    songs = []

    # 找到表格
    table = soup.find('table', class_='m-table m-table-album')

    # 找到tbody下的所有tr标签
    trs = table.tbody.find_all('tr')

    print(f"共找到{len(trs)}行歌曲数据，专辑：{album}")

    # 遍历每个tr，提取你需要的信息，比如歌曲ID、标题、时长、歌手等
    for tr in trs:
        # tr的id属性就是歌曲的唯一标识
        song_id = tr.get('id')

        # 找歌曲标题链接的b标签里的title属性
        title_tag = tr.find('b')
        title = title_tag['title'] if title_tag and title_tag.has_attr('title') else None

        # 时长在第三个td里，class是 s-fc3，下的span.u-dur
        duration_tag = tr.find('td', class_='s-fc3')
        duration = duration_tag.find('span', class_='u-dur').text if duration_tag else None

        # 歌手名在最后一个td里a标签中，可能有多个a，拼接起来
        last_td = tr.find_all('td')[-1]
        singer_div = last_td.find('div', class_='text')
        singers = singer_div['title'] if singer_div and singer_div.has_attr('title') else None

        print(f"歌曲ID: {song_id}, 标题: {title}, 时长: {duration}, 歌手: {singers}")
        songs.append({
            "id": song_id,
            "title": title,
            "duration": duration,
            "singers": singers
        })

    driver.quit()
    return songs



final_results = {}
albums = get_albums("59642824")
print(f"共找到 {len(albums)} 张专辑：")
for album_id, album_title in albums:
    print(f"\n{album_id} : {album_title}")
    songs = get_songs(album_id, album_title)
    final_results[album_id] = {
        "name": album_title,
        "songs": songs
    }

with open("assets/songs.json", "w", encoding="utf-8") as f:
    json.dump(final_results, f, ensure_ascii=False, indent=4)


songs_list = []
with open("assets/songs.json", "r", encoding="utf-8") as f:
    final_results = json.load(f)
    for key, value in final_results.items():
        for song in value["songs"]:
            songs_list.append(song)

print(len(songs_list))
for i in songs_list:
    print(i)

with open("assets/songs_list.json", "w", encoding="utf-8") as f:
    json.dump(songs_list, f, ensure_ascii=False, indent=4)