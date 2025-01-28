import MessagePassageDrawer from "./MessagePassageDrawer";

type MessageProps = {
  title: string;
  passage: string;
  messenger: string;
  words: string;
  className?: string;
};

export default function Message({
  title,
  passage,
  messenger,
  words,
  className = "",
}: MessageProps) {
  return (
    <div
      className={`flex flex-col justify-center items-center text-gray-800
    ${className}`}
    >
      <div className="font-light tracking-widest">메세지</div>
      <h3 className="gsans-bold text-2xl mt-2">{title}</h3>
      <MessagePassageDrawer passage={passage} words={words}>
        <div className="font-light underline cursor-pointer">{passage}</div>
      </MessagePassageDrawer>
      <div className="font-extralight">{messenger}</div>
    </div>
  );
}
