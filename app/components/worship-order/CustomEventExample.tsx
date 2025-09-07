import CustomEvent from "./CustomEvent";

// 예시: 기존 페이지의 prayer 섹션을 CustomEvent로 커스터마이징하는 방법
export default function CustomEventExample({ postId }: { postId: number }) {
  // 실제 사용 시에는 데이터베이스나 API에서 가져온 데이터를 사용
  const customEvents = [
    {
      eventId: "opening-prayer",
      index: 1,
      eventName: "기도",
      name: "김영희",
      description: "시작기도",
    },
    {
      eventId: "praise-time",
      index: 2,
      eventName: "찬양",
      name: "박민수",
      description: "주일찬양",
    },
    {
      eventId: "message-time",
      index: 3,
      eventName: "말씀",
      name: "최성호 목사",
      description: "주일설교",
    },
    {
      eventId: "closing-prayer",
      index: 4,
      eventName: "기도",
      name: "이지은",
      description: "마무리기도",
    },
  ];

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-center mb-8">예배 순서</h2>
      {customEvents.map((event) => (
        <CustomEvent
          key={event.eventId}
          postId={postId}
          eventId={event.eventId}
          index={event.index}
          eventName={event.eventName}
          name={event.name}
          description={event.description}
        />
      ))}
    </div>
  );
}
