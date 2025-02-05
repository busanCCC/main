import { NextResponse } from "next/server";

let posts = [
  {
    id: 1,
    title: "xx월 xx일 목요채플",
    passage: "요한복음 1장 1절",
    messenger: "간사1",
    word: "`25   한밤중에 바울과 실라가 기도하고 하나님을 찬송하매 죄수들이 듣더라\n26   이에 갑자기 큰 지진이 나서 옥터가 움직이고 문이 곧 다 열리며 모든 사람의 매인 것이 다 벗어진지라\n27   간수가 자다가 깨어 옥문들이 열린 것을 보고 죄수들이 도망한 줄 생각하고 칼을 빼어 자결하려 하거늘\n28   바울이 크게 소리 질러 이르되 네 몸을 상하지 말라 우리가 다 여기 있노라 하니\n29   간수가 등불을 달라고 하며 뛰어 들어가 무서워 떨며 바울과 실라 앞에 엎드리고\n30   그들을 데리고 나가 이르되 선생들이여 내가 어떻게 하여야 구원을 받으리이까 하거늘\n31   이르되 주 예수를 믿으라 그리하면 너와 네 집이 구원을 받으리라 하고\n`",
    content: "This is the first post",
    createdAt: new Date().toISOString(),
    schedule: "2025-01-23T00:00Z",
    path: "",
  },
  {
    id: 2,
    title: "2025 TST수련회 개회예배",
    passage: "요한복음 1장 2절",
    messenger: "간사2",
    word: "2   그가 태초에 하나님과 함께 계셨고",
    content: "This is the second post",
    createdAt: new Date().toISOString(),
    schedule: "2025-02-03T00:00Z",
  },
];

// GET: 모든 글 반환 또는 특정 ID로 글 조회
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const eventId = parseInt(params.id);
  const post = posts.find((p) => p.id === eventId);

  if (!post) {
    return NextResponse.json({ message: "Post not found" }, { status: 404 });
  }

  return NextResponse.json(post);
}



// PUT: 글 수정
export async function PUT(req: Request) {
  const body = await req.json();
  const {
    id,
    newTitle,
    newPassage,
    newMessenger,
    newWord,
    newContent,
    newSchedule,
  } = body;

  const postIndex = posts.findIndex((post) => post.id === id);
  if (postIndex === -1) {
    return NextResponse.json({ message: "Post not found." }, { status: 404 });
  }

  if (newTitle) posts[postIndex].title = newTitle;
  if (newPassage) posts[postIndex].passage = newPassage;
  if (newMessenger) posts[postIndex].messenger = newMessenger;
  if (newWord) posts[postIndex].word = newWord;
  if (newContent) posts[postIndex].content = newContent;
  if (newSchedule) posts[postIndex].schedule = newSchedule;

  return NextResponse.json(posts[postIndex], { status: 200 });
}

// DELETE: 글 삭제
export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id"); // 쿼리 매개변수에서 ID 가져오기

  if (!id) {
    return NextResponse.json(
      { message: "ID is required for deletion." },
      { status: 400 }
    );
  }

  posts = posts.filter((post) => post.id !== parseInt(id));

  return NextResponse.json(
    { message: "Post deleted successfully." },
    { status: 200 }
  );
}
