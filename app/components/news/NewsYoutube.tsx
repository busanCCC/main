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
    playerVars: {
      autoplay: 0,
    },
  };

  return (
    <YouTube
      videoId={youtubeId}
      opts={opts}
      onReady={onPlayerReady}
      className="w-full flex justify-center items-center max-w-lg"
    />
  );
}
