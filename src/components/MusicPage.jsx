import React, {useEffect, useMemo, useState} from "react";
import songsData from "../assets/songs.json";

const MusicPage = ({
    baseSize,
    songsList,
    showMusicPageZIndex,
    setShowMusicPageZIndex,
    musicID,
    setMusicID,
}) => {
    const albumBySongId = useMemo(() => {
        const map = {};
        Object.values(songsData).forEach((album) => {
            const albumTitle = album?.name || "";
            (album?.songs || []).forEach((song) => {
                if (song?.id) {
                    map[String(song.id)] = albumTitle;
                }
            });
        });
        return map;
    }, []);

    return (
        <div
            className="absolute w-full h-full flex items-center justify-center"
            style={{zIndex: showMusicPageZIndex}}
            onClick={()=>{setShowMusicPageZIndex(-1)}}
        >
            <style>{`
                @keyframes albumMarquee {
                    0% { transform: translateX(100%); }
                    100% { transform: translateX(-100%); }
                }
                .album-scroll {
                    display: inline-block;
                    white-space: nowrap;
                    animation-name: albumMarquee;
                    animation-timing-function: linear;
                    animation-iteration-count: infinite;
                }
            `}</style>
            <div
                className="absolute w-[80%] h-[80%] flex flex-col justify-center "
                style={{background: '#2B2D39'}}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{marginTop: `${baseSize * 20}px`, marginLeft: `${baseSize * 10}px`, marginRight: `${baseSize * 10}px`}}>
                    <iframe
                        frameborder="no" border="0" marginwidth="0" marginheight="0" width={`${baseSize * 280}`} height="86"
                        src={`https://music.163.com/m/outchain/player?type=2&id=${musicID}&auto=1&height=66`}>
                    </iframe>
                </div>

                <label
                    style={{
                        fontSize: `${baseSize * 12}px`,
                        color: "lightgray",
                        marginLeft: `${baseSize * 20}px`,
                        marginRight: `${baseSize * 20}px`,
                        marginBottom: `${baseSize * 5}px`
                }}>
                    只能选择一首歌循环播放，不能自己设置多首歌顺序播放。有些浏览器可能会限制音频的播放数量，同时播放超过一个音频会被打断。
                </label>

                <div
                    className="flex flex-col overflow-y-auto"
                    style={{marginBottom: `${baseSize * 20}px`, marginLeft: `${baseSize * 10}px`, marginRight: `${baseSize * 10}px`}}
                >
                    <div className="flex grid grid-cols-1">
                        {songsList.map((char, index) => {
                            const rawId = String(char["id"] || "");
                            const id = rawId.slice(0, 10);
                            const isActive = musicID === id;
                            const albumName = char["album"] || albumBySongId[rawId] || albumBySongId[id] || "未知专辑";
                            const albumText = `专辑：${albumName}`;
                            return (
                                <React.Fragment key={id}>
                                    <button
                                        onClick={() => {setMusicID(id)}}
                                        style={{
                                            fontSize: `${baseSize * 16}px`,
                                            backgroundColor: "transparent",
                                            padding: `${baseSize * 6}px 0`,
                                            width: "100%",
                                            textAlign: "left",
                                            borderRadius: 0,
                                            border: "none",
                                            outline: "none",
                                            appearance: "none",
                                            color: isActive ? "white" : "#6e6f75",
                                            textShadow: "none"
                                        }}
                                    >
                                        <div style={{display: "flex", flexDirection: "column", gap: `${baseSize * 4}px`}}>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "baseline",
                                                    gap: `${baseSize * 6}px`,
                                                    textShadow: isActive ? `0 0 ${baseSize * 4}px white, 0 0 ${baseSize * 8}px white` : "none"
                                                }}
                                            >
                                                <span style={{flex: 1, minWidth: 0}}>{char["title"]}</span>
                                                <span
                                                    style={{
                                                        fontSize: `${baseSize * 12}px`,
                                                        color: isActive ? "#c9ccd9" : "#8a8f9f",
                                                        textShadow: "none",
                                                        marginLeft: "auto",
                                                        textAlign: "right"
                                                    }}
                                                >
                                                    {char["duration"]}
                                                </span>
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: `${baseSize * 12}px`,
                                                    color: isActive ? "#c9ccd9" : "#8a8f9f",
                                                    overflow: "hidden",
                                                    whiteSpace: "nowrap",
                                                    textOverflow: "ellipsis"
                                                }}
                                            >
                                                {albumText}
                                            </div>
                                        </div>
                                    </button>
                                    {index !== songsList.length - 1 ? (
                                        <div
                                            style={{
                                                height: `${Math.max(1, baseSize)}px`,
                                                backgroundColor: "#4f5366"
                                            }}
                                        />
                                    ) : null}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>


            </div>


        </div>
    );
}

export default MusicPage;
