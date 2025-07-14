import React, {useEffect, useState} from "react";

const MusicPage = ({
    baseSize,
    songsList,
    showMusicPageZIndex,
    setShowMusicPageZIndex,
    musicID,
    setMusicID,
}) => {

    return (
        <div
            className="absolute w-full h-full flex items-center justify-center"
            style={{zIndex: showMusicPageZIndex}}
            onClick={()=>{setShowMusicPageZIndex(-1)}}
        >
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
                    <div className="flex grid grid-cols-1 gap-[1.5vmin]">
                        {songsList.map((char) => {
                            const id = char["id"].slice(0, 10);
                            return (
                                <button
                                    key={id}
                                    onClick={() => {setMusicID(id)}}
                                    style={{
                                        fontSize: `${baseSize * 16}px`,
                                        backgroundColor: "transparent",
                                        padding: 0,
                                        color: musicID === id ? "white" : "#6e6f75",
                                        textShadow: musicID === id ? `0 0 ${baseSize * 4}px white, 0 0 ${baseSize * 8}px white` : "none"
                                    }}
                                >
                                    {char["title"]}
                                </button>
                            );
                        })}
                    </div>
                </div>


            </div>


        </div>
    );
}

export default MusicPage;