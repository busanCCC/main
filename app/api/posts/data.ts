type Praise = {
  id: number; // 찬양 index
  title: string; // 찬양 제목
  youtubeUrl: string; // 유튜브 링크
};

type Post = {
  id: number;
  title: string;
  subTitle?: string; // 🔹 선택 속성으로 추가
  passage: string;
  messenger: string;
  word: string;
  content?: string;
  createdAt: string;
  schedule: string;
  liveUrl?: string; // youtube 생방송 URL
  openingPrayer?: string;
  generalPrayer?: string;
  offeringPrayer?: string;
  testimonyPrayer?: string;
  praises?: Praise[];
};

export let posts: Post[] = [
  {
    id: 1,
    title: "xx월 xx일 목요채플",
    subTitle: "1번섬김채플",
    passage: "요한복음 1장 1절",
    messenger: "간사1",
    word: "`25   한밤중에 바울과 실라가 기도하고 하나님을 찬송하매 죄수들이 듣더라\n26   이에 갑자기 큰 지진이 나서 옥터가 움직이고 문이 곧 다 열리며 모든 사람의 매인 것이 다 벗어진지라\n27   간수가 자다가 깨어 옥문들이 열린 것을 보고 죄수들이 도망한 줄 생각하고 칼을 빼어 자결하려 하거늘\n28   바울이 크게 소리 질러 이르되 네 몸을 상하지 말라 우리가 다 여기 있노라 하니\n29   간수가 등불을 달라고 하며 뛰어 들어가 무서워 떨며 바울과 실라 앞에 엎드리고\n30   그들을 데리고 나가 이르되 선생들이여 내가 어떻게 하여야 구원을 받으리이까 하거늘\n31   이르되 주 예수를 믿으라 그리하면 너와 네 집이 구원을 받으리라 하고\n`",
    content: "This is the first post",
    createdAt: new Date().toISOString(),
    schedule: "2025-01-23T00:00Z",
    openingPrayer: "권혜림 순장",
    generalPrayer: "심민균 순장",
    offeringPrayer: "서혜나 순장",
    praises: [
      {
        id: 1,
        title: "주께 가오니",
        youtubeUrl: "https://www.youtube.com/watch?v=q3eemQqUE8g",
      },
      {
        id: 2,
        title: "예수 우리왕이여",
        youtubeUrl: "https://www.youtube.com/watch?v=M6MzmzXe7gQ",
      },
      {
        id: 3,
        title: "주가 일하시네",
        youtubeUrl: "https://www.youtube.com/watch?v=09BcoSNaxdk",
      },
    ],
  },
  {
    id: 2,
    title: "2025 TST수련회 개회예배",
    subTitle: "2번 섬김채플",
    passage: "요한복음 1장 2절",
    messenger: "간사2",
    word: "2   그가 태초에 하나님과 함께 계셨고",
    content: "This is the second post",
    createdAt: new Date().toISOString(),
    schedule: "2025-02-03T00:00Z",
    openingPrayer: "권혜림 순장2",
    generalPrayer: "심민균 순장2",
    testimonyPrayer: "신종웅 순장2",
    offeringPrayer: "서혜나 순장2",
    praises: [
      {
        id: 1,
        title: "주께 가오니2",
        youtubeUrl: "https://www.youtube.com/watch?v=q3eemQqUE8g",
      },
      {
        id: 2,
        title: "예수 우리왕이여2",
        youtubeUrl: "https://www.youtube.com/watch?v=M6MzmzXe7gQ",
      },
      {
        id: 3,
        title: "주가 일하시네2",
        youtubeUrl: "https://www.youtube.com/watch?v=09BcoSNaxdk",
      },
    ],
  },
];

export function updatePosts(newPosts: Post[]) {
  posts.length = 0;
  posts.push(...newPosts);
}
