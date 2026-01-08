import json
import time
from typing import List, Tuple

import requests



songs_json_path = "src/assets/songs.json"
songs_list_path = "src/assets/songs_list.json"

SESSION = requests.Session()
SESSION.headers.update({
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/143.0.0.0 Safari/537.36",
    "Referer": "https://music.163.com/",
})

def _get_json(url, params=None):
    response = SESSION.get(url, params=params, timeout=15)
    response.raise_for_status()
    return response.json()

def ensure_id_exists(data_list, target_id, default_obj):
    # 判断是否已有目标 id
    if not any(item.get("id") == target_id for item in data_list):
        data_list.append(default_obj)
    return data_list

def get_albums(artist_id: str) -> List[Tuple[int, str]]:
    limit = 50
    offset = 0
    albums: List[Tuple[int, str]] = []
    total = None

    while total is None or offset < total:
        url = f"https://music.163.com/api/artist/albums/{artist_id}"
        params = {
            "id": artist_id,
            "offset": offset,
            "total": "true" if offset == 0 else "false",
            "limit": limit,
        }
        data = _get_json(url, params=params)
        total = data.get("total") or total or 0
        album_items = data.get("hotAlbums") or data.get("albums") or []
        for album in album_items:
            album_id = album.get("id")
            album_title = album.get("name") or "未知专辑"
            if album_id:
                albums.append((album_id, album_title))
        offset += limit
        time.sleep(0.3)

    return albums

def _format_duration(ms):
    if ms is None:
        return None
    seconds = int(ms) // 1000
    return f"{seconds // 60:02d}:{seconds % 60:02d}"

def get_song_detail(song_id: int):
    url = "https://music.163.com/api/song/detail/"
    params = {
        "id": song_id,
        "ids": f"[{song_id}]",
    }
    data = _get_json(url, params=params)
    songs = data.get("songs") or []
    return songs[0] if songs else None

def get_songs(album_id, album_title):
    url = f"https://music.163.com/api/album/{album_id}"
    params = {
        "ext": "true",
        "id": album_id,
        "offset": 0,
        "total": "true",
        "limit": 10,
    }
    data = _get_json(url, params=params)
    song_items = data.get("songs") or data.get("album", {}).get("songs") or data.get("album", {}).get("tracks") or []
    if not song_items and data.get("code") not in (None, 200):
        print(f"专辑接口返回异常，album_id={album_id}, code={data.get('code')}")

    print(f"共找到{len(song_items)}行歌曲数据，专辑：{album_title}")
    songs = []

    for song in song_items:
        song_id = song.get("id")
        if not song_id:
            continue
        detail = get_song_detail(song_id)
        if detail:
            title = detail.get("name")
            duration = _format_duration(detail.get("duration"))
            artists = detail.get("artists") or []
        else:
            title = song.get("name")
            duration = _format_duration(song.get("duration"))
            artists = song.get("artists") or []
        singers = "/".join(artist.get("name") for artist in artists if artist.get("name"))

        print(f"歌曲ID: {song_id}, 标题: {title}, 时长: {duration}, 歌手: {singers}")
        songs.append({
            "id": str(song_id),
            "title": title,
            "duration": duration,
            "singers": singers
        })
        time.sleep(0.2)

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

with open(songs_json_path, "w", encoding="utf-8") as f:
    json.dump(final_results, f, ensure_ascii=False, indent=4)


songs_list = []
with open(songs_json_path, "r", encoding="utf-8") as f:
    final_results = json.load(f)
    for key, value in final_results.items():
        for song in value["songs"]:
            songs_list.append(song)


print(len(songs_list))
for i in songs_list:
    print(i)

with open(songs_list_path, "w", encoding="utf-8") as f:
    json.dump(songs_list, f, ensure_ascii=False, indent=4)
