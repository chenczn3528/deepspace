import React, {useEffect, useState} from "react";
import LeftIcon from "../icons/LeftIcon.jsx";
import InfoIcon from "../icons/InfoIcon.jsx";

const buildPlayerUrl = (bvid, page) => {
    if (!bvid) return "";
    const p = page || 1;
    return `https://player.bilibili.com/player.html?bvid=${encodeURIComponent(bvid)}&p=${encodeURIComponent(p)}&autoplay=auto&preload=auto&quality=1080p&isOutside=true`;
};

const VideoPage = ({
    fontsize,
    isPortrait,
    showPageZIndex,
    setShowPageZIndex,
    videoInfo,
}) => {
    const [playerUrl, setPlayerUrl] = useState("");
    const [externalLink, setExternalLink] = useState("");

    useEffect(() => {
        const bvid = (videoInfo?.bvid || "").trim();
        if (!bvid) {
            setPlayerUrl("");
            setExternalLink("");
            return;
        }

        const page = Number(videoInfo?.page) || 1;
        const url = buildPlayerUrl(bvid, page);
        setPlayerUrl(url);
        setExternalLink(`https://www.bilibili.com/video/${bvid}?p=${page}`);
    }, [videoInfo?.bvid, videoInfo?.page]);

    return (
        <div
            className="absolute w-full h-full flex items-center justify-center"
            style={{zIndex: showPageZIndex}}
            onClick={(e) => {
                e.stopPropagation();
                setShowPageZIndex(-1)
            }}
        >
            {/*返回按钮*/}
            <button
                className="absolute z-110"
                onClick={()=>setShowPageZIndex(-1)}
                style={{
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    left: `${fontsize}px`,
                    top: `${fontsize * 1.2}px`
                }}
            >
                <LeftIcon size={fontsize * 2.5} color="white"/>
            </button>

            {externalLink && (
                <a
                    href={externalLink}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="absolute z-110"
                    style={{
                        left: `${fontsize * 4}px`,
                        top: `${fontsize * 1.4}px`,
                        background: 'transparent',
                        padding: 0,
                        display: 'inline-flex'
                    }}
                >
                    <InfoIcon size={fontsize * 2} color="#fff" />
                </a>
            )}


            <iframe
                src={playerUrl || "about:blank"}
                width={isPortrait ? window.innerWidth : window.innerHeight}
                height={isPortrait ? window.innerHeight : window.innerWidth}
                scrolling="no" border="0" frameBorder="no" framespacing="0" allowFullScreen></iframe>
        </div>
    );
}

export default VideoPage;
