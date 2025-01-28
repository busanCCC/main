import { NextApiRequest, NextApiResponse } from "next";

let posts = [
  {
    id: 1,
    title: "First Post",
    passage: "요한복음 1장 1절",
    messenger: "간사1",
    word: "1   태초에 말씀이 계시니라 이 말씀이 하나님과 함께 계셨으니 이 말씀은 곧 하나님이시니라",
    content: "This is the first post",
  },
  {
    id: 2,
    title: "Second Post",
    passage: "요한복음 1장 2절",
    messenger: "간사1",
    word: "2   그가 태초에 하나님과 함께 계셨고",
    content: "This is the second post",
  },
];

export default function PostHandler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case "GET": // 모든 글 불러오기기
      res.status(200).json(posts);
      break;

    case "POST": // 글 생성
      const { title, passage, messenger, word, content } = req.body;
      if (!title || !content) {
        res.status(400).json({ message: "Title and Content are required. " });
        return;
      }
      const newPost = {
        id: posts.length + 1,
        title,
        passage,
        messenger,
        word,
        content,
      };
      posts.push(newPost);
      res.status(201).json(newPost);
      break;

    case "PUT": // 글 수정
      const { id, newTitle, newPassage, newMessenger, newWord, newContent } =
        req.body;
      const postIndex = posts.findIndex((post) => post.id === id);
      if (postIndex === -1) {
        res.status(404).json({ message: "Post not found." });
        return;
      }
      if (newTitle) posts[postIndex].title = newTitle;
      if (newPassage) posts[postIndex].passage = newPassage;
      if (newMessenger) posts[postIndex].messenger = newMessenger;
      if (newWord) posts[postIndex].word = newWord;
      if (newContent) posts[postIndex].content = newContent;
      res.status(200).json(posts[postIndex]);
      break;

    case "DELETE": // 글 삭제
      const { deleteId } = req.body;
      posts = posts.filter((post) => post.id !== deleteId);
      res.status(200).json({ message: "Post deleted successfully." });
      break;

    default:
      res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
