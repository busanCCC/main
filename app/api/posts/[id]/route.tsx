import { NextResponse } from "next/server";

let posts = [
  {
    id: 1,
    title: "xx월 xx일 목요채플",
    passage: "요한복음 1장 1절",
    messenger: "간사1",
    word: "1   태초에 말씀이 계시니라 이 말씀이 하나님과 함께 계셨으니 이 말씀은 곧 하나님이시니라",
    content: "This is the first post",
    createdAt: new Date().toISOString(),
    schedule: "2025-01-23T00:00Z",
    path: "",
  },
  {
    id: 2,
    title: "2025 TST수련회 개회예배",
    passage: "요한복음 1장 2절",
    messenger: "간사1",
    word: "2   그가 태초에 하나님과 함께 계셨고",
    content: "This is the second post",
    createdAt: new Date().toISOString(),
    schedule: "2025-02-03T00:00Z",
  },
];

// GET: 모든 글 반환
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const post = posts.find((post) => post.id === parseInt(id));

  if (!post) {
    return NextResponse.json({ message: "Post not found." }, { status: 404 });
  }
  return NextResponse.json(posts, { status: 200 });
}

// POST: 새 글 생성
export async function POST(req: Request) {
  const body = await req.json();
  const { title, passage, messenger, word, content, schedule } = body;

  if (!title || !content) {
    return NextResponse.json(
      { message: "Title and Content are required." },
      { status: 400 }
    );
  }

  const newPost = {
    id: posts.length + 1,
    title,
    passage,
    messenger,
    word,
    schedule,
    createdAt: new Date().toISOString(),
    content,
  };

  posts.push(newPost);
  return NextResponse.json(newPost, { status: 201 });
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
  const body = await req.json();
  const { deleteId } = body;

  posts = posts.filter((post) => post.id !== deleteId);

  return NextResponse.json(
    { message: "Post deleted successfully." },
    { status: 200 }
  );
}
