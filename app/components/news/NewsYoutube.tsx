import React from "react";
import YouTube, { YouTubeProps } from "react-youtube";

type NewsYoutubeProps = {
  youtubeId: string;
};

export default function NewsYoutube({ youtubeId }: NewsYoutubeProps) {
  const onPlayerReady: YouTubeProps["onReady"] = (event) => {
    // access to player in all event handlers via event.target
    event.target.pauseVideo();
  };

  const opts: YouTubeProps["opts"] = {
    width: "100%",
    height: "100%",
    playerVars: {
      autoplay: 0,
    },
  };

  return (
    <div className="relative w-full h-0 pb-[56.25%] overflow-hidden rounded-md">
      <div className="absolute top-0 left-0 w-full h-full">
        <YouTube
          videoId={youtubeId}
          opts={opts}
          onReady={onPlayerReady}
          className="w-full h-full"
        />
      </div>
    </div>
  );
}
