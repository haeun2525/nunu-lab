export type Lang = "ko" | "en";

export const LANGS: Lang[] = ["ko", "en"];

/** UI 문자열. 프로젝트 본문은 lib/projects.ts 안에 따로 들어 있다. */
export const T = {
  ko: {
    tabHome: "홈",
    tabRepo: "저장소",
    tabGuest: "방명록",

    role: "AI 크리에이터",
    brand: "누누랩",
    brandEn: "Nunulab",
    bio1: "바이브코딩과 피지컬 AI가 만났을 때",
    bio2: "결국 현실은 하드웨어 세상이니까….",
    bio3: "어디까지 되나 보자 | 지금 바로 저점매수 하세요 ✌🏻",

    visitToday: "오늘 방문",
    visitTotal: "누적 방문",
    ghClicks: "깃허브 이동",

    orbRepo: "피지컬 AI",
    orbRepoSub: "→ 저장소로 이동",
    orbGuest: "바이브코딩",
    orbGuestSub: "→ 방명록으로 이동",
    orbStore: "보드 사러 가기",
    orbStoreSub: "→ NU40DK 스토어",

    hint: "배경 위에서 마우스를 움직여 보세요",

    repoTitle: "저장소",
    repoLead: "만든 것들. 눌러서 열어보고, 가져가서 만들어 보세요.",
    sortClicks: "저장 많은순",
    sortRecent: "최근순",
    sortOldest: "오래된순",
    backToRepo: "← 저장소로",
    openGithub: "깃허브에서 열기",
    posted: "인스타 업로드",
    watchVideo: "원본 영상 보기",
    close: "닫기",
    noticeEmpty: "공지가 없습니다",
    noticeEdit: "공지 수정",
    noticeLocked: "운영자 확인",
    noticeLockedSub: "비밀번호를 넣으면 공지를 고칠 수 있습니다.",
    noticeUnlock: "확인",
    noticeText: "배너 문구",
    noticePlaceholder: "새로 올라온 영상의 레포를 봐보세요!",
    noticeLink: "눌렀을 때",
    linkNone: "이동 안 함",
    linkUrl: "외부 주소",
    linkInternal: "사이트 안 페이지",
    noticeSave: "저장",
    noticeHint: "문구를 비우고 저장하면 배너가 사라집니다.",
    gateTitle: "혹시 팔로우하셨나요?",
    gateBody:
      "코드는 그냥 가져가셔도 됩니다. 다만 다음 편이 궁금하시면 인스타에서 만나요 👾",
    gateFollow: "팔로우하러 가기",
    gateGo: "깃허브로 가기",
    shots: "사진",
    reviews: "후기",
    reviewsLead: "만들어 보셨거나, 궁금한 게 있으면 남겨주세요.",

    guestTitle: "방명록",
    guestLead: "익명이든 실명이든, 편하게 남기고 가세요.",

    namePlaceholder: "이름",
    anonName: "익명",
    anonymous: "익명으로",
    bodyPlaceholder: "여기에 남겨주세요",
    submit: "남기기",
    sending: "보내는 중…",
    emptyComments: "아직 아무도 없습니다. 첫 번째가 되어 주세요.",
    tooLong: "2000자까지 쓸 수 있습니다.",
    failed: "저장에 실패했습니다. 잠시 후 다시 시도해 주세요.",

    footNote:
      "이 사이트의 프로젝트는 전부 NU40DK 보드로 만들었습니다. 코드는 열려 있으니 가져가서 만들어 보세요.",
  },
  en: {
    tabHome: "Home",
    tabRepo: "Archive",
    tabGuest: "Guestbook",

    role: "AI Creator",
    brand: "Nunulab",
    brandEn: "누누랩",
    bio1: "When vibe coding meets physical AI",
    bio2: "Because in the end, reality runs on hardware….",
    bio3: "Let's see how far this goes | Buy the dip ✌🏻",

    visitToday: "Today",
    visitTotal: "All time",
    ghClicks: "To GitHub",

    orbRepo: "Physical AI",
    orbRepoSub: "→ Open projects",
    orbGuest: "Vibe coding",
    orbGuestSub: "→ Open guestbook",
    orbStore: "Get the board",
    orbStoreSub: "→ NU40DK store",

    hint: "Move your cursor over the background",

    repoTitle: "Archive",
    repoLead: "Things I built. Open one up, take it, build your own.",
    sortClicks: "Most saved",
    sortRecent: "Newest",
    sortOldest: "Oldest",
    backToRepo: "← Back",
    openGithub: "Open on GitHub",
    posted: "Posted",
    watchVideo: "Watch the reel",
    close: "Close",
    noticeEmpty: "No notice",
    noticeEdit: "Edit notice",
    noticeLocked: "Admin only",
    noticeLockedSub: "Enter the password to edit the notice.",
    noticeUnlock: "Unlock",
    noticeText: "Banner text",
    noticePlaceholder: "New build just went up — go read the code!",
    noticeLink: "On click",
    linkNone: "Do nothing",
    linkUrl: "External URL",
    linkInternal: "Page on this site",
    noticeSave: "Save",
    noticeHint: "Save an empty text to hide the banner.",
    gateTitle: "Already following?",
    gateBody:
      "Take the code, it's free. If you want to see what comes next, find me on Instagram 👾",
    gateFollow: "Follow me",
    gateGo: "Go to GitHub",
    shots: "Photos",
    reviews: "Reviews",
    reviewsLead: "Built it yourself, or got a question? Leave a note.",

    guestTitle: "Guestbook",
    guestLead: "Anonymous or not — say hi.",

    namePlaceholder: "Name",
    anonName: "Anonymous",
    anonymous: "Post anonymously",
    bodyPlaceholder: "Write something",
    submit: "Post",
    sending: "Sending…",
    emptyComments: "Nothing here yet. Be the first.",
    tooLong: "2000 characters max.",
    failed: "Could not save. Please try again.",

    footNote:
      "Every project here runs on the NU40DK board. The code is open — take it and build.",
  },
} as const;

/** `as const` 때문에 값이 리터럴 타입이 된다. ko/en 이 서로 대입 가능하도록 string 으로 넓힌다. */
export type Dict = { [K in keyof (typeof T)["ko"]]: string };
