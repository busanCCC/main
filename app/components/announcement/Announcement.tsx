type AnnouncementProps = {
  index: number;
  title: string;
  content: string;
  subContent?: string;
  className?: string;
};

export default function Announcement({
  index,
  title,
  content,
  subContent,
  className = "",
}: AnnouncementProps) {
  return (
    <div
      className={`flex flex-col justify-center items-center gap-4 text-gray-800 text-center
        ${className}`}
    >
      <h3 className="gsans-bold text-2xl">
        #{index}. {title}
      </h3>

      <div className="font-medium whitespace-pre-line text-center flex flex-col gap-1">
        {content}
        {subContent && (
          <div className="font-medium text-sm gsans-light whitespace-pre-line text-center">
            {subContent}
          </div>
        )}
      </div>
    </div>
  );
}
