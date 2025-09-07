interface CustomEventProps {
  postId: number; // 어떤 페이지의 글인지 식별
  eventId: string; // 이벤트 고유 ID
  index: number; // 해당 채플 내에서의 순서
  eventName: string; // 이벤트명 (예: "기도", "찬양", "말씀" 등)
  name?: string; // 해당하는 사람의 이름 (선택사항)
  description?: string; // 추가 설명 (선택사항)
  className?: string; // 추가 스타일링을 위한 클래스
}

export default function CustomEvent({
  postId,
  eventId,
  index,
  eventName,
  name,
  description,
  className = "",
}: CustomEventProps) {
  return (
    <div
      className={`flex flex-col justify-center items-center gap-4 text-gray-800 ${className}`}
      data-post-id={postId}
      data-event-id={eventId}
      data-index={index}
    >
      <div className="font-light tracking-widest">{eventName}</div>
      <h3 className="gsans-bold text-2xl">
        {name
          ? `${name}${description ? ` - ${description}` : ""}`
          : description || "CustomEventDescription"}
      </h3>
    </div>
  );
}
