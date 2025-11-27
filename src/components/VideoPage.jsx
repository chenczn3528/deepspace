import React from "react";
import LeftIcon from "../icons/LeftIcon.jsx";
import InfoIcon from "../icons/InfoIcon.jsx";

const buildExternalLink = (url) => {
    try {
        const parsed = new URL(url);
        const bvid = parsed.searchParams.get("bvid");
        const page = parsed.searchParams.get("p") || "1";
        if (bvid) {
            return `https://www.bilibili.com/video/${bvid}?p=${page}`;
        }
        if (parsed.hostname.includes("bilibili.com")) {
            return parsed.href;
        }
    } catch (e) {
        return url;
    }
    return url;
};

const VideoPage = ({
    fontsize,
    isPortrait,
    showPageZIndex,
    setShowPageZIndex,
    video_url,
}) => {
    const externalLink = buildExternalLink(video_url || "");

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


            <iframe
                src={video_url}
                width={isPortrait ? window.innerWidth : window.innerHeight}
                height={isPortrait ? window.innerHeight : window.innerWidth}
                scrolling="no" border="0" frameBorder="no" framespacing="0" allowFullScreen="true"></iframe>
        </div>
    );
}

export default VideoPage;
