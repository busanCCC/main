// ✅ 서버 컴포넌트
import WorshipOrderSection from "../../../components/WorshipOrderSection";
import MainSection from "../../../components/MainSection";
import AnnouncementSection from "../../../components/AnnouncementSection";
import NewsSection from "../../../components/NewsSection";
import Header from "../../../components/ui/Header";

// ✅ Next.js에서 서버 컴포넌트에서 동적 라우팅을 위한 props
export default async function EventPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  // ✅ 서버에서 API 호출
  const res = await fetch(`http://localhost:3000/api/posts/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return (
      <div className="text-center p-10 text-red-500">
        해당 게시물을 찾을 수 없습니다.
      </div>
    );
  }

  const post = await res.json();

  return (
    <div className="w-full h-full overflow-y-auto">
      <Header />
      <MainSection title={post.title} />
      <WorshipOrderSection
        passage={post.passage}
        messenger={post.messenger}
        word={post.word}
      />
      <AnnouncementSection content={post.content} />
      <NewsSection createdAt={post.createdAt} schedule={post.schedule} />
    </div>
  );
}
