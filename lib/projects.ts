/**
 * 갤러리에 뜨는 프로젝트 목록.
 *
 * draft: true 면 갤러리·상세 어디에도 안 뜬다. 릴스가 아직 안 올라간 건은
 * 여기를 false 로만 바꾸면 바로 공개된다. (레포도 같이 public 으로 돌릴 것)
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
      ko: "유튜브 링크를 주면 음원을 분석해서 LED 4개를 파동에 맞춰 구동한다.",
      en: "Give it a YouTube link and it drives four LEDs to the waveform.",
    },
    body: [
      {
        ko: "유튜브 링크 하나만 넣으면 yt-dlp 가 음원을 받아오고, numpy 로 STFT 를 돌려 주파수를 4개 밴드로 나눈다. 그 값을 60fps 로 USB 시리얼에 실어 보드로 보내면 LED 4개가 음악에 맞춰 움직인다.",
        en: "Paste a YouTube link: yt-dlp pulls the audio, numpy runs an STFT and splits it into four frequency bands. Those values stream over USB serial at 60fps and the four LEDs move with the music.",
      },
      {
        ko: "여기에 맥 알림센터를 감시하는 기능을 붙였다. 지정한 사람에게 카톡이 오면 LED 가 6초간 알림 패턴을 낸다. 카톡 전용이 아니라 알림센터를 읽는 구조라, 다른 앱은 번들 ID 한 줄만 추가하면 된다.",
        en: "It also watches the macOS notification center. When a chosen person messages you, the LEDs run a six-second alert pattern. It reads the notification DB rather than any single app, so adding another app is one line.",
      },
      {
        ko: "함정은 전부 저장소 README 에 적어 뒀다. 왜 immutable=1 을 쓰면 안 되는지, 그룹채팅에서 발신자를 못 가리는 이유 같은 것들.",
        en: "Every gotcha is written up in the repo README — why immutable=1 breaks things, why group chats can't identify a sender, and so on.",
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
      ko: "버튼 4개짜리 미니 보드. 하나 누르면 그 앱이 뜬다.",
      en: "A four-button board. Press one and that app opens.",
    },
    body: [
      {
        ko: "보드의 버튼 4개에 앱을 하나씩 물려 뒀다. 1번은 인스타그램, 2번은 터미널, 3번은 팀즈, 4번은 핀터레스트. 누르면 맥에서 그 앱이 바로 뜬다.",
        en: "Each of the four buttons is bound to an app. Press it and the Mac opens that app.",
      },
      {
        ko: "설정이 두 벌이다. `config.json` 은 버튼 하나에 앱 하나, `config.modes.json` 은 출근·코딩·디자인·퇴근처럼 묶어서 여러 앱을 한 번에 연다. 띄울 때 어느 쪽을 쓸지 고른다.",
        en: "There are two configs: one app per button, or grouped modes (commute / coding / design / off) that open several apps at once. You pick which one at launch.",
      },
      {
        ko: "잘 안 될 때는 배선부터 의심하지 말고 런처가 떠 있는지부터 확인하는 게 빠르다.",
        en: "If it stops working, check that the launcher process is running before you suspect the wiring.",
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
      ko: "회사에 도착하면 폰이 먼저 알아채고, 보드가 반짝이고, 맥이 깨어난다.",
      en: "Arrive at the office: your phone notices first, the board lights up, the Mac wakes.",
    },
    body: [
      {
        ko: "보드가 iBeacon 을 쏘고, 아이폰이 그 비콘의 영역에 들어오는 순간을 잡는다. 앱이 꺼져 있어도 iOS 가 깨워 주기 때문에 '문을 열고 들어가면 알아서'가 성립한다. 설계의 핵심이 이 부분이다.",
        en: "The board broadcasts an iBeacon and the iPhone catches the region entry. iOS wakes the app even when it's closed, which is what makes 'it just happens when you walk in' possible.",
      },
      {
        ko: "그 다음은 연출이다. 폰에 알림과 잠금화면 카드가 뜨고, 책상 위 보드가 반짝이고, 맥이 깨어나면서 환영 화면과 정해 둔 앱들이 순서대로 열린다.",
        en: "Then the show: a notification and lock-screen card on the phone, the board blinking on the desk, and the Mac waking into a welcome screen with your apps opening in order.",
      },
      {
        ko: "환영 문구·열 앱 목록·음성은 `host/config.json` 에서 바꾼다. 화면 연출 없이 앱만 뜨게 하려면 `welcome_screen` 을 false 로 두면 된다.",
        en: "Greeting text, app list and voice all live in host/config.json. Set welcome_screen to false to skip the visuals and just open the apps.",
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
      ko: "보드와 폰이 멀어지면 폰이 슬퍼한다. 거리 감지 커플 위젯.",
      en: "When the board and the phone drift apart, the phone gets sad.",
    },
    body: [
      {
        ko: "보드가 BLE 페리페럴, 아이폰이 센트럴이다. 신호 세기로 거리를 재서 붙어 있으면 '같이 있어요', 멀어지면 '슬퍼요' 상태로 넘어간다.",
        en: "The board is a BLE peripheral, the phone a central. Signal strength gives distance: close means 'together', far means 'sad'.",
      },
      {
        ko: "표정은 다섯 가지다. 평온 · 알아챔 · 불안 · 패닉 · 포기, 그리고 다시 만나면 하트. 거리에 따라 상태가 넘어가고 다이나믹 아일랜드와 위젯에도 그대로 뜬다.",
        en: "Five faces: calm, noticing, anxious, panic, giving up — plus hearts when you're back together. The state follows the distance and shows up in the Dynamic Island and the widget too.",
      },
      {
        ko: "거리만으로는 연출이 순서대로 안 나온다. 신호 세기가 실내에서 튀기 때문이다. 그래서 상태 전이에 이력(hysteresis)과 최소 유지 시간을 넣었다.",
        en: "Distance alone won't give you a clean sequence — indoor signal strength jumps around. So the state machine has hysteresis and a minimum dwell time.",
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

/** 스토어는 프로젝트가 아니라 링크지만, 클릭 집계는 같은 방식으로 센다. */
export const STORE_URL =
  "https://nucode.store/product/ble-%EB%AA%A8%EB%93%88-nu40-dk-nu40-dk-%EB%B8%94%EB%A3%A8%ED%88%AC%EC%8A%A4-nrf52840-soc-%EA%B0%9C%EB%B0%9C%EB%B3%B4%EB%93%9C-%EC%95%84%EB%91%90%EC%9D%B4%EB%85%B8-ide-%ED%98%B8%ED%99%98-%EB%85%B8%EB%A5%B4%EB%94%95-%EC%A0%80%EC%A0%84%EB%A0%A5-%EC%95%88%ED%85%8C%EB%82%98-/18/category/1/display/2/";

export const SOCIAL = {
  instagram: "https://www.instagram.com/physical_nunu",
  tiktok: "https://www.tiktok.com/@physical_nunu",
  github: "https://github.com/haeun2525",
};
