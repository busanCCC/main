import { NextResponse } from "next/server";
import { posts } from "./data";

export async function GET() {
  return NextResponse.json(posts);
}

// POST: 새 글 생성
export async function POST(req: Request) {
  const body = await req.json();
  const { title, subTitle, passage, messenger, word, content, schedule } = body;

  if (!title || !content) {
    return NextResponse.json(
      { message: "Title and Content are required." },
      { status: 400 }
    );
  }

  const newPost = {
    id: posts.length + 1,
    title,
    subTitle,
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
