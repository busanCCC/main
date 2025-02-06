type NewsData = {
  id: number;
  title: string;
  type: "video" | "image" | "text";
  content: string; // 실제 내용 (영상 url, 이미지 url, 텍스트 등)
  callToAction?: CallToAction[];
  description?: string; // 부가설명 내용
};

type Praise = {
  id: number; // 찬양 index
  title: string; // 찬양 제목
  youtubeUrl: string; // 유튜브 링크
};

type CallToAction = { // 버튼 생성시 
  text: string; // 버튼 내용
  url?: string; // 다이렉트 할 url
};

type Announcements = { // 광고
  id: number;
  title: string; // 광고 제목
  content?: string; // 광고 내용
  subContent?: string; // 부가 설명 내용
  callToAction?: CallToAction[];
};

type Post = {
  id: number;
  title: string; // 이벤트 제목
  subTitle?: string; // 이벤트 부제목 ex)~섬김채플, 기도회 등
  passage: string; // 말씀 구절 ex) 요한복음 1장 1절 ~ 5절
  messenger: string; // 메신저
  word: string; // 말씀 본문
  content?: string; // 내용
  createdAt: string; // 글생성 타임스탬프
  schedule: string; // 일정
  liveUrl?: string; // youtube 생방송 URL
  openingPrayer?: string; // 시작 기도
  generalPrayer?: string; // 대표 기도
  offeringPrayer?: string; // 헌금 기도
  testimonyPrayer?: string; // 간증
  testimonyTitle?: string; // 간증 제목
  praises?: Praise[]; // 찬양 목록
  announcements?: Announcements[]; // 광고 목록
  news?: NewsData[]; // 부산지구 소식 목록
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
    announcements: [
      {
        id: 1,
        title: "2024 금식수련회 가등록",
        content:
          "일시: 12월 26일~28일 | 장소: 감림산 기도원 \n 회비: 가등록 2만원/완등록 6만원",
        callToAction: [
          {
            text: "등록하러가기",
            url: "https://sites.google.com/kccc.org/2024fastpray/home",
          },
        ],
      },
      {
        id: 2,
        title: "금식수련회 이벤트: 복권 이벤트",
        content:
          "금식수련회 기도회 노트가 오늘 배부됩니다! \n 기도 노트에 10개의 기도제목을 작성하시면 복권 1개!",
      },
      {
        id: 3,
        title: "홀리라이프 금식수련회 연합찬양팀 모집",
        content:
          "모집분야: 건반, 드럼, 베이스, 일렉기타, 싱어, 호산나\n연습일정: 12월 23~24일\n신청 및 문의사항 최기정순장(010-1234-5678)",
      },
      {
        id: 4,
        title: "예배 전 기도회",
        content:
          "시간: 오후 5시\n장소: 산성교회 지하 세미나실\n예배를 위해서 기도할 기도핑을 찾습니다!\n함께 예배를 세워가는 모두가 됩시다!",
      },
      {
        id: 5,
        title: "부산지구 리트릿",
        content:
          "시간: 오후 9시\n장소: 부산 CCC 비전센터\n기도로 무장하는 부산지구 C맨이 됩시다!",
        subContent: "*졸업반 모임이 시작됩니다",
      },
      {
        id: 6,
        title: "다음주 채플은 '넘치는 교회'에서 진행합니다.",
        callToAction: [
          {
            text: "넘치는 교회 위치 확인하기",
            url: "https://naver.me/xOC1Cl3z",
          },
        ],
      },
    ],
    news: [
      {
        id: 1,
        title: "금식수련회 총단 간증영상",
        type: "video",
        content: "cQcxxaMN87I",
        description: "함께 가요 금식수련회",
      },
      {
        id: 2,
        title: "소원 총단과 함께하는 여호수아 기도회 아웃도어",
        type: "image",
        content: "https://picsum.photos/300",
        description:
          "부산지구 10월 31일 목요채플 광고입니다 !\n이번주 목요채플은 ❝ 여호수아 기도회 ❞ 로 함께합니다 ◡̈ \n소원총단 🐮☝🏻 과 함께하는 특별한 아웃도어 시간이 준비되어 있으니 많관부‼️",
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
    testimonyTitle: "TST 간증",
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
    announcements: [
      {
        id: 1,
        title: "2025 TST 수련회 가등록",
        content:
          "일시: 2월 3일~8일 | 장소: 거제 썬트리팜 \n 회비: 가등록 3만원/완등록 15만원",
        callToAction: [
          {
            text: "등록하러가기",
            url: "https://sites.google.com/kccc.org/2025tst/home",
          },
        ],
      },
      {
        id: 2,
        title: "금식수련회 이벤트: 복권 이벤트",
        content:
          "금식수련회 기도회 노트가 오늘 배부됩니다! \n 기도 노트에 10개의 기도제목을 작성하시면 복권 1개!",
      },
      {
        id: 3,
        title: "홀리라이프 금식수련회 연합찬양팀 모집",
        content:
          "모집분야: 건반, 드럼, 베이스, 일렉기타, 싱어, 호산나\n연습일정: 12월 23~24일\n신청 및 문의사항 최기정순장(010-1234-5678)",
      },
      {
        id: 4,
        title: "예배 전 기도회",
        content:
          "시간: 오후 5시\n장소: 산성교회 지하 세미나실\n예배를 위해서 기도할 기도핑을 찾습니다!\n함께 예배를 세워가는 모두가 됩시다!",
      },
      {
        id: 5,
        title: "부산지구 리트릿",
        content:
          "시간: 오후 9시\n장소: 부산 CCC 비전센터\n기도로 무장하는 부산지구 C맨이 됩시다!",
        subContent: "*졸업반 모임이 시작됩니다",
      },
      {
        id: 6,
        title: "다음주 채플은 '넘치는 교회'에서 진행합니다.",
        callToAction: [
          {
            text: "넘치는 교회 위치 확인하기",
            url: "https://naver.me/xOC1Cl3z",
          },
        ],
      },
    ],
    news: [
      {
        id: 1,
        title: "TST 홍보영상",
        type: "video",
        content: "cd7X-TGx7to",
        description: '"말씀앞에서" 2025 TST 수련회',
      },
      {
        id: 2,
        title: "소원 총단과 함께하는 여호수아 기도회 아웃도어",
        type: "image",
        content: "https://picsum.photos/300",
        description:
          "부산지구 10월 31일 목요채플 광고입니다 !\n이번주 목요채플은 ❝ 여호수아 기도회 ❞ 로 함께합니다 ◡̈ \n소원총단 🐮☝🏻 과 함께하는 특별한 아웃도어 시간이 준비되어 있으니 많관부‼️",
      },
    ],
  },
];

export function updatePosts(newPosts: Post[]) {
  posts.length = 0;
  posts.push(...newPosts);
}
