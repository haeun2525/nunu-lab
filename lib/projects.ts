/**
 * 갤러리에 뜨는 프로젝트 목록 — 원본.
 *
 * draft: true 면 갤러리·상세 어디에도 안 뜬다. 릴스가 아직 안 올라간 건은
 * 여기를 false 로만 바꾸면 바로 공개된다. (레포도 같이 public 으로 돌릴 것)
 *
 * 문구는 사이트에서 운영자 모드로도 고칠 수 있고, 그렇게 고친 건 DB 에 따로 쌓여
 * 여기 적힌 것보다 우선한다. → lib/projects-server.ts
 * 그래서 이 파일만 고쳤는데 화면이 안 바뀌면, 그 프로젝트에 화면에서 고친 게 남아 있는 것이다.
 * 편집기에서 '원래대로'를 누르면 이 파일 내용으로 돌아온다.
 */

export type Lang = "ko" | "en";

export type Bilingual = { ko: string; en: string };

export type Project = {
  slug: string;
  no: number;
  repo: string; // haeun2525/xxx
  title: Bilingual;
  tagline: Bilingual;
  body: Bilingual[]; // 상세 페이지 본문 문단
  tags: string[];
  thumb: string;
  images: string[];
  /** 인스타 게시물 퍼머링크. 없으면 '원본 영상 보기' 버튼이 안 뜬다. */
  videoUrl: string | null;
  /** 저장소에 올린 날(YYYY-MM-DD). 7일 이내면 갤러리에 NEW 뱃지가 붙는다.
   *  null 이면 초기 등록분이라 뱃지 대상이 아니다. */
  addedAt: string | null;
  postedAt: string | null; // 인스타 업로드일
  draft: boolean;
};

export const PROJECTS: Project[] = [
  {
    slug: "music-led",
    no: 1,
    repo: "haeun2525/nu40dk_music_led",
    title: { ko: "NU40DK 뮤직 LED", en: "NU40DK Music LED" },
    tagline: {
      ko: "유튜브 링크 하나 넣으면, 노래에 맞춰 LED가 춤춥니다.",
      en: "Paste one YouTube link and the LEDs dance to the song.",
    },
    body: [
      {
        ko: "좋아하는 노래의 유튜브 주소를 붙여넣기만 하면 돼요. 컴퓨터가 그 노래를 들으면서 낮은 소리·중간 소리·높은 소리로 나누고, 책상 위 LED 4개를 박자에 맞춰 움직입니다. 작은 클럽 조명을 하나 두는 느낌이에요.",
        en: "Just paste the link to a song you like. The computer listens, splits it into low, mid and high sounds, and moves the four LEDs on your desk in time with the beat. It's like having a tiny club light next to you.",
      },
      {
        ko: "여기에 하나를 더 붙였습니다. 기다리던 사람한테 카톡이 오면 LED가 6초 동안 반짝여요. 폰을 엎어 두고 다른 일을 하고 있어도 눈에 들어옵니다.",
        en: "I added one more thing: when a message comes in from someone you're waiting on, the LEDs blink for six seconds. Even with your phone face down, you'll notice.",
      },
      {
        ko: "카톡만 되는 건 아니에요. 컴퓨터에 뜨는 알림을 대신 봐 주는 구조라, 다른 앱도 한 줄만 더 적으면 똑같이 반짝입니다.",
        en: "It isn't tied to one messenger — it watches the notifications your computer already shows, so adding another app is a single line.",
      },
    ],
    tags: ["Python", "Arduino", "STFT", "macOS"],
    thumb: "/thumbs/music-led.jpg",
    images: ["/thumbs/music-led.jpg"],
    videoUrl: "https://www.instagram.com/p/Db5R_pQyGsX/",
    addedAt: null,
    postedAt: "2026-08-11",
    draft: false,
  },
  {
    slug: "launcher",
    no: 2,
    repo: "haeun2525/nu40dk_launcher",
    title: { ko: "NU40DK 앱 런처", en: "NU40DK App Launcher" },
    tagline: {
      ko: "버튼 4개짜리 작은 보드. 하나 누르면 그 앱이 켜집니다.",
      en: "A little board with four buttons. Press one, that app opens.",
    },
    body: [
      {
        ko: "책상 위 작은 보드에 버튼이 네 개 있어요. 1번은 인스타그램, 2번은 터미널, 3번은 팀즈, 4번은 핀터레스트. 누르면 컴퓨터에서 그 앱이 바로 열립니다. 마우스로 아이콘을 찾아 들어가는 몇 초가 사라져요.",
        en: "Four buttons sitting on your desk: Instagram, Terminal, Teams, Pinterest. Press one and that app opens on your computer — no hunting for the icon.",
      },
      {
        ko: "쓰는 방법이 두 가지예요. 버튼 하나에 앱 하나를 물려 두거나, '출근 · 코딩 · 디자인 · 퇴근'처럼 묶어서 버튼 한 번에 앱 여러 개를 한꺼번에 여는 방식. 켤 때 어느 쪽으로 쓸지 고르면 됩니다.",
        en: "Two ways to use it: one app per button, or grouped modes — 'arrive', 'coding', 'design', 'leaving' — where one press opens several apps at once. You pick when you start it.",
      },
      {
        ko: "눌러도 반응이 없으면 선부터 의심하지 마세요. 컴퓨터에서 프로그램이 켜져 있는지 먼저 보면 열에 아홉은 그거였습니다.",
        en: "If a press does nothing, don't blame the wiring first — check that the little program is still running on your computer. Nine times out of ten that's it.",
      },
    ],
    tags: ["Python", "Arduino", "macOS"],
    thumb: "/thumbs/launcher.jpg",
    images: ["/thumbs/launcher.jpg"],
    videoUrl: "https://www.instagram.com/p/Db-NozDymyG/",
    addedAt: null,
    postedAt: "2026-08-13",
    draft: false,
  },
  {
    slug: "welcome",
    no: 3,
    repo: "haeun2525/nu40dk_welcome",
    title: { ko: "NU40DK 웰컴", en: "NU40DK Welcome" },
    tagline: {
      ko: "회사에 도착하면 폰이 먼저 알아채고, 보드가 반짝이고, 컴퓨터가 깨어납니다.",
      en: "Walk into the office: your phone notices, the board lights up, the computer wakes.",
    },
    body: [
      {
        ko: "책상 위 보드가 자기 자리에서 계속 신호를 보내고 있어요. 그 근처에 들어서면 폰이 알아서 알아챕니다. 앱을 미리 켜 두거나 뭘 누를 필요가 없어요. 문 열고 들어오면 그냥 됩니다.",
        en: "The board on your desk quietly announces itself, and your phone notices when you get close. You don't have to open an app or press anything — you just walk in.",
      },
      {
        ko: "그다음은 연출이에요. 폰에 환영 알림이 뜨고, 책상 위 보드가 반짝이고, 컴퓨터가 깨어나면서 오늘 쓸 앱들이 순서대로 열립니다. 자리에 앉으면 이미 준비가 끝나 있어요.",
        en: "Then the welcome runs: a greeting on your phone, the board blinking on your desk, and the computer waking up with your apps opening one after another. By the time you sit down, everything is ready.",
      },
      {
        ko: "환영 문구도, 열리는 앱 목록도, 목소리도 설정에서 바꿀 수 있어요. 화면 연출 없이 앱만 조용히 열리게 해 둘 수도 있습니다.",
        en: "The greeting, the list of apps and the voice are all yours to change — or you can skip the on-screen part and just have the apps open quietly.",
      },
    ],
    tags: ["Swift", "iBeacon", "BLE", "Arduino"],
    thumb: "/thumbs/welcome.jpg",
    images: ["/thumbs/welcome.jpg"],
    videoUrl: "https://www.instagram.com/p/DcFJRCGSgAG/",
    addedAt: null,
    postedAt: "2026-08-14",
    draft: false,
  },
  {
    slug: "together",
    no: 4,
    repo: "haeun2525/nu40dk_together",
    title: { ko: "NU40DK 투게더", en: "NU40DK Together" },
    tagline: {
      ko: "보드와 폰이 멀어지면 폰 속 캐릭터가 슬퍼합니다. 거리 감지 커플 위젯.",
      en: "Walk away from the board and the little character on your phone gets sad.",
    },
    body: [
      {
        ko: "한 사람이 보드를 갖고 나가고, 다른 사람은 폰을 봅니다. 둘이 가까이 있으면 '같이 있어요', 멀어지면 '슬퍼요'로 표정이 바뀌어요. 지금 곁에 있는지가 폰 화면에 그대로 보입니다.",
        en: "One of you carries the board, the other watches their phone. Close by, it's 'we're together'; far away, it turns sad. Whether they're near you shows up right on the screen.",
      },
      {
        ko: "표정은 다섯 가지예요. 평온 → 알아챔 → 불안 → 패닉 → 포기, 그리고 다시 만나면 하트. 앱을 켜지 않아도 잠금화면 위쪽과 위젯에서 지금 표정이 보입니다.",
        en: "Five faces — calm, noticing, anxious, panicking, giving up — and hearts when you're back together. You can see the current face without opening the app, right on the lock screen and the widget.",
      },
      {
        ko: "만들면서 제일 애먹은 건 실내에서 신호가 자꾸 튄다는 거였어요. 가만히 있어도 표정이 왔다 갔다 하길래, 한 번 바뀌면 잠깐은 그 표정을 유지하도록 다듬었습니다.",
        en: "The hard part was that indoor signals jump around — the face kept flipping even when nobody moved. So once it changes, it now holds that face for a beat before changing again.",
      },
    ],
    tags: ["Swift", "BLE", "Arduino"],
    thumb: "/thumbs/together.jpg",
    images: ["/thumbs/together.jpg"],
    videoUrl: "https://www.instagram.com/p/DcP450BykKQ/",
    addedAt: "2026-08-20",
    postedAt: "2026-08-20",
    draft: false,
  },
  {
    slug: "lyrics",
    no: 5,
    repo: "haeun2525/nu40-lyrics",
    title: { ko: "NU40DK 가사 디스플레이", en: "NU40DK Lyrics Display" },
    tagline: {
      ko: "노래를 틀면 손바닥만 한 화면에 가사가 뜨고, 소리에 맞춰 막대가 춤춥니다.",
      en: "Play a song and the lyrics show up on a palm-sized screen, with bars dancing to the sound.",
    },
    body: [
      {
        ko: "노트북에서 노래를 틀면, 지금 나오는 그 대목의 가사가 작은 화면에 뜹니다. 아래에서는 막대들이 소리에 맞춰 오르내리고요. 책상 위에 나만 듣는 라디오가 한 대 생기는 셈이에요.",
        en: "Play a song on your laptop and the line that's playing right now appears on a little screen, with bars bouncing to the sound underneath. It's like having your own tiny radio on the desk.",
      },
      {
        ko: "배경은 네 가지예요. 별이 쏟아지는 밤, 물결, 카세트테이프, 도시 야경. 노래를 듣는 중에 보드의 버튼을 누르면 바로 바뀌고, 배경도 비트에 맞춰 같이 움직입니다.",
        en: "There are four backdrops — a starry night, ripples, a cassette tape, a city skyline. Press a button on the board mid-song and it switches right away, and the backdrop moves with the beat too.",
      },
      {
        ko: "소리도 일부러 옛날 라디오처럼 만들었어요. 살짝 지직거리고 물먹은 듯한 톤인데, 얼마나 낡은 소리로 들을지는 취향껏 조절할 수 있습니다.",
        en: "The sound is deliberately old-radio: a little crackly and washed out. How worn it sounds is up to you.",
      },
      {
        ko: "노래 대신 춤추는 영상을 넣으면 화면 속 사람이 그 춤을 따라 춥니다. 같은 화면으로 만든 다른 모드예요.",
        en: "Feed it a dance video instead of a song and the figure on screen copies the moves — the same screen, a different mode.",
      },
    ],
    tags: ["Python", "Arduino", "OLED", "macOS"],
    thumb: "/thumbs/lyrics.jpg",
    images: ["/thumbs/lyrics.jpg"],
    // 릴스는 아직 안 올라갔다. 올리면 운영자 모드 ✎ 로 영상 링크를 채우면 된다.
    videoUrl: null,
    addedAt: "2026-08-20",
    postedAt: "2026-08-20",
    draft: false,
  },
];

/** 저장소에 올린 지 7일 이내인가. 갤러리 NEW 뱃지 판정용. */
export const NEW_DAYS = 7;
export function isNew(p: Project, now: Date = new Date()): boolean {
  if (!p.addedAt) return false;
  const added = new Date(`${p.addedAt}T00:00:00+09:00`);
  if (Number.isNaN(added.getTime())) return false;
  return now.getTime() - added.getTime() < NEW_DAYS * 86400_000;
}

/** 공개된 것만. 갤러리·상세·사이트맵 전부 이걸 쓴다. */
export const publicProjects = () => PROJECTS.filter((p) => !p.draft);

export const findProject = (slug: string) =>
  publicProjects().find((p) => p.slug === slug) ?? null;

/** 스토어는 프로젝트가 아니라 링크지만, 클릭 집계는 같은 방식으로 센다.
 *  UTM 은 /go/store 가 붙여 주니 여기엔 깨끗한 상품 주소만 둔다.
 *  (검색으로 들어갔을 때 붙는 NaPm·nl-ts-pid 같은 건 그 사람의 클릭 기록이라 떼어 냈다) */
export const STORE_URL =
  "https://smartstore.naver.com/smarthomefarm/products/11378859588";

export const SOCIAL = {
  instagram: "https://www.instagram.com/physical_nunu",
  tiktok: "https://www.tiktok.com/@physical_nunu",
  github: "https://github.com/haeun2525",
};
