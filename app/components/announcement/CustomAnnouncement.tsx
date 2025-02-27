type CustomAnnouncementProps = {
  index: number;
  title: string;
  children: React.ReactNode;
  className?: string;
};

export default function CustomAnnouncement({
  index,
  title,
  children,
  className = "",
}: CustomAnnouncementProps) {
  return (
    <div
      className={`flex flex-col justify-center items-center gap-4 text-gray-800 text-center
        ${className}`}
    >
      <h3 className="gsans-bold text-2xl responsive-announce-text">
        #{index}. {title}
      </h3>
      <div className="font-medium text-center">{children}</div>
    </div>
  );
}
