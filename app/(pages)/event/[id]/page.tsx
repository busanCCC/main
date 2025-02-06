// ✅ 서버 컴포넌트
import WorshipOrderSection from "../../../components/WorshipOrderSection";
import MainSection from "../../../components/MainSection";
import AnnouncementSection from "../../../components/AnnouncementSection";
import NewsSection from "../../../components/NewsSection";
import Header from "../../../components/ui/Header";

type Post = {
  passage: string;
  messenger: string;
  word: string;
  title: string;
  content: string;
  createdAt: string;
  schedule: string;
};

async function fetchPostData(id: string): Promise<Post | null> {
  const res = await fetch(`http://localhost:3000/api/posts/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return null; // 이벤트가 없으면 null 반환
  }

  return res.json();
}

// ✅ Next.js에서 서버 컴포넌트에서 동적 라우팅을 위한 props
export default async function EventPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const postData = await fetchPostData(id);

  if (!postData) {
    return (
      <div className="text-center p-10 text-red-500">
        해당 게시물을 찾을 수 없습니다.
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto">
      <Header />
      <MainSection />
      <WorshipOrderSection
        passage={postData.passage}
        messenger={postData.messenger}
        word={postData.word}
      />
      <AnnouncementSection content={postData.content} />
      <NewsSection
        createdAt={postData.createdAt}
        schedule={postData.schedule}
      />
    </div>
  );
}
