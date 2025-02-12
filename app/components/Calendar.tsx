import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { Dialog, DialogContent, DialogHeader } from "./ui/dialog";
import { DialogDescription } from "@radix-ui/react-dialog";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { supabase } from "@/api/supabase";

type Schedule = {
  id: number;
  title: string;
  createdAt: string;
  schedule: string; // ISO 8601 형식의 날짜
};

const Calendar = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Schedule | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // 클라이언트 측에서 데이터 fetch
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const { data, error } = await supabase.from("posts").select("*");

        if (error) {
          throw error;
        }

        setSchedules(data); // 데이터 받아오면 상태 업데이트
        setLoading(false);
      } catch (err: any) {
        setError(err.message); // 에러 처리
        setLoading(false); // 로딩 상태 종료
      }
    };

    fetchSchedules();
  }, []);

  if (loading) {
    return <div>Loading...</div>; // 로딩 중일 때 표시
  }

  if (error) {
    return <div>Error: {error}</div>; // 에러 발생 시 표시
  }
  // FullCalendar에 전달할 events 배열 생성
  const events = schedules.map((schedule) => ({
    title: schedule.title,
    date: schedule.schedule, // 일정 시작 날짜
    allDay: true,
    extendedProps: schedule,
  }));

  const handleEventMouseClick = (mouseClickinfo: any) => {
    const { event } = mouseClickinfo;
    const clickedEvent = event.extendedProps;
    setSelectedEvent(clickedEvent);
    setIsDialogOpen(true);
  };

  // eventMouseEnter 핸들러
  const handleEventMouseEnter = (mouseEnterInfo: any) => {
    const { event, el } = mouseEnterInfo;
    // 이벤트 강조 효과 (예: 배경색 변경)
    el.style.opacity = "0.5";
  };

  // eventMouseLeave 핸들러 (추가로 강조 해제 처리)
  const handleEventMouseLeave = (mouseLeaveInfo: any) => {
    const { el } = mouseLeaveInfo;

    // 강조 효과 제거
    el.style.opacity = "1";
  };
  const router = useRouter();

  const handleDelete = async () => {
    if (!selectedEvent) return;

    const confirmDelete = confirm("정말 삭제하시겠습니까?");
    if (!confirmDelete) return;

    try {
      // ✅ Supabase에서 해당 ID의 이벤트 삭제
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", selectedEvent.id);

      if (error) throw error;

      alert("삭제되었습니다.");

      // ✅ UI에서도 삭제된 일정 제거 후 다이얼로그 닫기
      setSchedules((prev) =>
        prev.filter((event) => event.id !== selectedEvent.id)
      );
      setIsDialogOpen(false);
    } catch (error) {
      console.error("삭제 오류:", error);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="App">
      <FullCalendar
        initialView="dayGridMonth" // defaultView 대신 initialView 사용
        plugins={[dayGridPlugin]}
        events={events} // events 속성에 데이터 전달
        locale="ko"
        contentHeight={550}
        eventMouseEnter={handleEventMouseEnter} // 마우스 오버 핸들러
        eventMouseLeave={handleEventMouseLeave} // 마우스 아웃 핸들러
        eventClick={handleEventMouseClick}
      />
      {selectedEvent && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>{selectedEvent.title}</DialogHeader>
            <DialogDescription>
              <p>
                일정: {new Date(selectedEvent.schedule).toLocaleString("ko-KR")}
              </p>
              <p>
                생성된 시간:
                {new Date(selectedEvent.createdAt).toLocaleString("ko-KR")}
              </p>
              <p className="flex justify-center mt-4 gap-4">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/event/${selectedEvent.id}`)}
                >
                  수정하기
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  삭제하기
                </Button>
              </p>
            </DialogDescription>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Calendar;
