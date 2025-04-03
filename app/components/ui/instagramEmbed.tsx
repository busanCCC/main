import { useEffect, useRef } from "react";

export default function InstagramEmbed() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.setAttribute("src", "//www.instagram.com/embed.js");
    script.setAttribute("async", "true");
    ref.current?.appendChild(script);
  }, []);

  return (
    <div ref={ref}>
      <blockquote
        className="instagram-media"
        data-instgrm-permalink="https://www.instagram.com/p/C_fEXYjxszo/?utm_source=ig_embed&amp;utm_campaign=loading"
        data-instgrm-version="14"
        style={{
          background: "#FFF",
          border: 0,
          borderRadius: "3px",
          boxShadow: "0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15)",
          margin: "1px",
          maxWidth: "540px",
          minWidth: "326px",
          padding: 0,
          width: "99.375%",
        }}
      ></blockquote>
    </div>
  );
}
