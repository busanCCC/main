import { NextResponse } from "next/server";
import { posts, updatePosts } from "../data";

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

  updatePosts(posts);

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

  const newPosts = posts.filter((post) => post.id !== parseInt(id));
  updatePosts(newPosts);

  return NextResponse.json(
    { message: "Post deleted successfully." },
    { status: 200 }
  );
}
