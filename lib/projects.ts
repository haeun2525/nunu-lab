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
  /** 브라우저에서 바로 써 볼 수 있는 주소. 있으면 상세에 '바로 사용해보기' 가 먼저 뜬다.
   *  보드 없이도 노는 것에만 붙인다. 운영자 모드에서는 못 고친다 (파일에서만) */
  liveUrl?: string | null;
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
    ],
    tags: ["Python", "Arduino", "OLED", "macOS"],
    thumb: "/thumbs/lyrics.jpg",
    images: ["/thumbs/lyrics.jpg"],
    videoUrl: "https://www.instagram.com/p/DcckwwyyVjF/",
    addedAt: "2026-08-20",
    // 미리 박아 뒀던 날짜를 실제 올라간 날로 고쳤다
    postedAt: "2026-08-25",
    draft: false,
  },
  {
    slug: "motion",
    no: 6,
    // 가사 디스플레이와 같은 저장소다. 같은 화면을 쓰는 다른 모드라서.
    repo: "haeun2525/nu40-lyrics",
    title: { ko: "NU40DK 댄스 모드", en: "NU40DK Dance Mode" },
    tagline: {
      ko: "춤추는 영상을 넣으면, 손바닥만 한 화면 속 형체가 그 춤을 따라 춥니다.",
      en: "Feed it a dance clip and the figure on the little screen copies the moves.",
    },
    body: [
      {
        ko: "좋아하는 무대 영상을 넣으면 화면 속 형체가 같은 춤을 춥니다. 게임에 나오는 춤추는 그림자 같은 거예요. 아래 막대는 노래에 맞춰 계속 오르내리고요.",
        en: "Drop in a stage clip and the figure on screen dances along — like the dancing silhouette in rhythm games. The bars underneath keep bouncing to the song.",
      },
      {
        ko: "다리는 일부러 안 그립니다. 숏폼 안무는 화면에 다리가 아예 안 들어오는 경우가 많은데, 그걸 억지로 그리면 있지도 않은 동작을 지어내게 되거든요. 머리·어깨·팔꿈치·손목·골반 아홉 군데만 따라갑니다.",
        en: "The legs are left out on purpose. Short-form choreo often crops them out entirely, and drawing them anyway means inventing moves that were never there. It follows nine points instead — head, shoulders, elbows, wrists, hips.",
      },
      {
        ko: "무거운 계산은 노트북이 미리 한 번만 합니다. 영상에서 동작을 뽑아 좌표로 저장해 두고, 재생할 때는 그 좌표만 흘려보내요. 보드는 받은 대로 그리기만 합니다.",
        en: "The heavy lifting happens once, up front. The laptop pulls the motion out of the video and saves it as coordinates; playback just streams those. The board only draws what it's handed.",
      },
      {
        ko: "가사 디스플레이와 같은 화면, 같은 저장소입니다. 노래를 넣으면 가사가 뜨고, 춤 영상을 넣으면 춤을 춥니다.",
        en: "Same screen, same repo as the lyrics display. Give it a song and you get lyrics; give it a dance clip and it dances.",
      },
    ],
    tags: ["Python", "MediaPipe", "Arduino", "OLED"],
    thumb: "/thumbs/motion.jpg",
    images: ["/thumbs/motion.jpg"],
    videoUrl: "https://www.instagram.com/p/Dccw2GrS_YJ/",
    addedAt: "2026-08-25",
    postedAt: "2026-08-25",
    draft: false,
  },
  {
    slug: "face-mirror",
    no: 7,
    repo: "haeun2525/nu40-face-mirror",
    title: { ko: "NU40DK 얼굴 미러", en: "NU40DK Face Mirror" },
    tagline: {
      ko: "웹캠 앞에서 웃으면, 손바닥만 한 화면 속 냥이도 같이 웃습니다.",
      en: "Smile at the webcam and the little cat on the tiny screen smiles back.",
    },
    body: [
      {
        ko: "카메라를 켜고 표정을 지으면 화면 속 픽셀 냥이가 그대로 따라 합니다. 눈을 감으면 같이 감고, 입을 벌리면 같이 벌리고, 고개를 기울이면 같이 기울여요. 아이폰 미모지와 같은 개념인데, 이 얼굴은 책상 위 0.96인치짜리 작은 화면에 뜹니다.",
        en: "Turn on the camera and the pixel cat copies your face. Close an eye and it closes one too; open your mouth, tilt your head, it follows. Same idea as an iPhone Memoji — except this face lives on a 0.96-inch screen on your desk.",
      },
      {
        ko: "보드가 없어도 됩니다. 웹페이지만 열면 표정 미션 9개(무표정·활짝 웃기·놀람·윙크·찡그림·뽀뽀·슬픔·메롱·잠자기)를 차례로 따라 하는 놀이가 그대로 돌아가요. 폰으로 열어도 됩니다.",
        en: "You don't need the board. Open the page and the nine-expression game — neutral, big smile, surprise, wink, frown, kiss, sad, tongue out, sleep — runs as it is. It works on a phone too.",
      },
      {
        ko: "컴퓨터는 완성된 그림을 보내지 않습니다. '입 벌림 72, 왼눈 감김 100, 고개 -12도' 같은 숫자만 보내고, 보드가 그 숫자로 얼굴을 조립해 그려요. 그래야 반응이 빠릅니다.",
        en: "The computer never sends a finished picture. It sends numbers — mouth 72, left eye 100, head −12° — and the board assembles the face from them. That's what keeps it quick.",
      },
      {
        ko: "웹캠 영상은 브라우저 밖으로 나가지 않습니다. 어디에도 업로드하지 않아요.",
        en: "The webcam video never leaves your browser. Nothing is uploaded anywhere.",
      },
    ],
    tags: ["MediaPipe", "Web Serial", "Arduino", "OLED"],
    thumb: "/thumbs/face-mirror.jpg",
    images: ["/thumbs/face-mirror.jpg"],
    videoUrl: null,
    liveUrl: "https://nu40-face-mirror.vercel.app",
    addedAt: "2026-08-27",
    postedAt: null,
    draft: false,
  },
  {
    slug: "stock-ticker",
    no: 8,
    repo: "haeun2525/nu40-stock-ticker",
    title: { ko: "NU40DK 주식 티커", en: "NU40DK Stock Ticker" },
    tagline: {
      ko: "손바닥만 한 화면에 지금 내 종목이 뜹니다. 떨어지면 LED가 켜져요.",
      en: "Your stocks on a palm-sized screen — and an LED that lights up when one drops.",
    },
    body: [
      {
        ko: "토스증권 오픈 API에서 시세를 받아 0.96인치 화면에 종목명 · 현재가 · 등락률 · 오늘 차트를 그립니다. 5초마다 갱신돼요. 보드의 버튼 네 개가 종목 네 개에 하나씩 붙어 있어서, 누를 때마다 화면이 바뀝니다.",
        en: "It pulls quotes from the Toss Securities open API and draws the name, price, change and today's chart on a 0.96-inch screen, refreshed every five seconds. The board's four buttons map to four stocks — press one and the screen switches.",
      },
      {
        ko: "미리 정해 둔 값 아래로 떨어지면 그 자리의 LED가 켜집니다. 지금 보고 있는 종목이 아니어도 켜져요 — 다른 게 떨어진 것도 알아야 하니까요.",
        en: "Set a floor price and the matching LED turns on when it's crossed — even for a stock you're not currently looking at, because that's the one you'd want to know about.",
      },
      {
        ko: "한글 종목명이 그대로 나옵니다. 화면 기본 글꼴에는 한글이 없어서, 완성형 2350자를 픽셀 글꼴로 직접 만들어 넣었습니다. '삼성전자'가 코드 대신 이름으로 뜹니다.",
        en: "Korean company names render as they are. The display's stock font has no Hangul, so all 2,350 precomposed syllables were built into a pixel font — you see the name, not the ticker code.",
      },
      {
        ko: "NU40은 와이파이가 없습니다. 그래서 인터넷 호출과 계산은 전부 PC(파이썬)가 하고, 보드는 받은 숫자를 그리기만 합니다. 그래야 반응이 빨라요.",
        en: "The NU40 has no WiFi, so a small Python program on the computer does the fetching and the maths, and the board only draws the numbers it is handed. That is what keeps it quick.",
      },
      {
        ko: "장이 닫힌 시간에도 가짜 시세로 하드웨어를 검증할 수 있고, 보드 없이 화면만 미리 그려 보는 도구도 같이 들어 있습니다.",
        en: "There is a mock feed for testing the hardware after hours, and a preview tool that renders the screen without a board at all.",
      },
    ],
    tags: ["토스 오픈API", "nRF52840", "OLED", "한글 글꼴"],
    thumb: "/thumbs/stock-ticker.jpg",
    images: ["/thumbs/stock-ticker.jpg"],
    videoUrl: "https://www.instagram.com/p/DckqQJuyjEB/",
    liveUrl: null,
    addedAt: "2026-08-28",
    postedAt: "2026-08-28",
    draft: false,
  },
  {
    slug: "explode-viewer",
    no: 9,
    repo: "haeun2525/defense-explode-viewer",
    title: { ko: "군 장비 분해 뷰어", en: "Military Gear Exploded Viewer" },
    tagline: {
      ko: "손을 펴면 장비가 분해되고, 그 속에 든 회로와 부품이 보입니다.",
      en: "Open your hand and the gear comes apart — showing the circuits and parts inside.",
    },
    body: [
      {
        ko: "배회탄약 Switchblade 300, 정찰 쿼드콥터, 야간투시경 PVS-7, 무인 지상 감시 센서, K2C1 소총. 장비 다섯 가지를 화면에서 한 겹씩 벗겨 볼 수 있어요. 부품마다 이름표와 한 줄 설명이 붙어 있습니다.",
        en: "A Switchblade 300 loitering munition, a recon quadcopter, PVS-7 night-vision goggles, an unattended ground sensor and a K2C1 rifle. Peel each one apart layer by layer — every part has a name tag and a one-line description.",
      },
      {
        ko: "웹캠 앞에서 손을 움직이면 장비가 따라 돌고, 손을 펴면 분해, 주먹을 쥐면 다시 조립됩니다. 검지로 부품 하나를 가리키고 있으면 그 부품만 크게 보여 줘요. 카메라가 없으면 마우스로 됩니다 — 드래그로 돌리고, 휠로 분해합니다.",
        en: "Move your hand in front of the webcam and the gear turns with it; open your hand to take it apart, make a fist to put it back together. Point at a part with your index finger and it zooms in on just that part. No camera? Use the mouse — drag to rotate, scroll to explode.",
      },
      {
        ko: "'작동 보기'를 누르면 신호가 어느 부품에서 어느 부품으로 흐르는지 단계별로 보여 줍니다.",
        en: "Press 'How it works' to see, step by step, how signals travel from one part to the next.",
      },
      {
        ko: "안에 든 부품 배치와 모양은 공개 자료를 바탕으로 그린 개념도예요. 실제 설계와는 다를 수 있습니다. 웹캠 영상은 브라우저 밖으로 나가지 않습니다.",
        en: "The parts and layout are a concept drawing based on public sources — the real design may differ. The webcam video never leaves your browser.",
      },
    ],
    tags: ["three.js", "MediaPipe", "Blender", "Web"],
    thumb: "/thumbs/explode-viewer.jpg",
    images: ["/thumbs/explode-viewer.jpg"],
    videoUrl: null,
    liveUrl: "https://defense-explode-viewer.vercel.app",
    addedAt: "2026-10-02",
    postedAt: null,
    draft: false,
  },
  {
    slug: "commute-board",
    no: 10,
    repo: "haeun2525/nu40-commute",
    title: { ko: "NU40DK 퇴근 알림 보드", en: "NU40DK Commute Board" },
    tagline: {
      ko: "지하철 시간에 맞춰 \"지금 출발해야 해요!\" 하고 알려 주는 책상 위 작은 화면.",
      en: "A tiny desk screen that tells you \"Leave now!\" in time to catch your train.",
    },
    body: [
      {
        ko: "서울시 지하철 API에서 회사 앞 역의 열차 시각을 받아, 지금 나가면 탈 수 있는 열차를 골라 줍니다. 화면에서는 픽셀 열차가 레일 위를 달려 역으로 다가오고, 출발선 깃발을 지나기 전에 캐릭터가 말을 걸어요.",
        en: "It pulls train times for the station near the office from the Seoul subway API and picks the train you can still catch if you leave now. On screen a pixel train rolls toward the station, and a little character speaks up before it passes the departure flag.",
      },
      {
        ko: "남은 시간에 따라 말이 바뀝니다. '아직 여유 있어요' → '슬슬 짐 싸야 해요' → '지금 뛰면 가능해요!' → '지금 출발해야 해요!'. 출발할 때가 되면 캐릭터가 깡총 뛰고 LED가 켜지고, 놓치면 '놓쳤어요… 다음 거!' 하고 다음 열차로 넘어갑니다.",
        en: "The message changes as time runs down: plenty of time → start packing → you can make it if you run → leave now. At go-time the character hops and an LED lights up; miss it and it says so, then moves on to the next train.",
      },
      {
        ko: "실시간 도착정보는 다음 열차 두 대, 4분 앞까지만 보여 줍니다. 역까지 걸어서 10분이면 그 열차는 이미 못 타요. 그래서 시간표로 탈 열차를 고르고, 실시간 정보는 지금 얼마나 늦어지고 있는지 보정하는 데만 씁니다.",
        en: "Live arrival data only shows the next two trains, about four minutes out — useless when the walk takes ten. So the timetable picks the train, and the live feed is only used to correct for delays.",
      },
      {
        ko: "NU40은 와이파이가 없어서 API 호출과 판단은 PC(파이썬)가 하고, 보드는 받은 상태로 그림을 그리고 남은 시간을 혼자 깎습니다. 퇴근 시간에만 저절로 켜지고, 버튼 하나로 10초 뒤에 켜거나 바로 끌 수 있어요.",
        en: "The NU40 has no WiFi, so Python on the computer calls the API and makes the decisions, while the board draws the scene and counts down on its own. It switches on only around leaving time, and one button turns it on in ten seconds or off right away.",
      },
      {
        ko: "인증키 없이 돌려 볼 수 있는 촬영용 데모 모드와, 보드 없이 화면만 미리 그려 보는 도구도 같이 들어 있습니다.",
        en: "There is a demo mode that runs without an API key, and a preview tool that renders the screen without a board.",
      },
    ],
    tags: ["서울 지하철 API", "nRF52840", "OLED", "픽셀 애니메이션"],
    thumb: "/thumbs/commute-board.jpg",
    images: ["/thumbs/commute-board.jpg"],
    videoUrl: "https://www.instagram.com/p/Deytw5fSpuS/",
    liveUrl: null,
    addedAt: "2026-10-23",
    postedAt: "2026-10-23",
    draft: false,
  },  {
    slug: "cat-card",
    no: 11,
    repo: "haeun2525/nu40-cat-card",
    title: { ko: "NU40DK 고양이 명함 키링", en: "NU40DK Cat Business Card Keyring" },
    tagline: {
      ko: "흔들면 고양이가 걸어 나와 인사하고, 내 이름과 QR을 띄우는 명함 키링.",
      en: "Shake it and a little cat walks out, waves, and shows your name and QR code.",
    },
    body: [
      {
        ko: "가방에 달린 키링을 흔들면 화면이 켜져요. 1비트 고양이가 걸어 나와 \"Hi!\" 하고 인사한 뒤 옆에 앉고, 이름이 한 글자씩 써지고 QR 코드가 내려옵니다. 처음 만난 사람이 폰으로 찍으면 바로 내 링크로 가요.",
        en: "Shake the keyring on your bag and the screen wakes up. A one-bit cat walks in, says \"Hi!\", sits down, your name types itself out and a QR code slides in. Whoever you just met scans it and lands on your link.",
      },
      {
        ko: "보드에 붙은 움직임 센서가 1초 안에 세 번 흔들렸는지를 봅니다. 그냥 걸을 때 흔들리는 정도로는 안 켜지게 문턱을 맞췄어요. 명함은 30초 동안 떠 있다가 고양이가 엎드려 잠들면서 화면이 꺼지고, 그 사이 또 흔들면 30초가 다시 시작돼요.",
        en: "The motion sensor on the board checks for three shakes within a second, tuned so ordinary walking doesn't set it off. The card stays up for 30 seconds, then the cat lies down to sleep and the screen goes dark — shake again in the meantime and the timer restarts.",
      },
      {
        ko: "고양이는 기존 그림을 가져오지 않고 파이썬에서 도형으로 직접 그렸어요. 컴퓨터에서 연출을 먼저 미리 보고 보드로 옮기는 식이라, 이름·QR 링크·고양이 모양 모두 몇 줄만 바꾸면 내 명함이 됩니다.",
        en: "The cat is an original sprite drawn from simple shapes in Python. The whole animation is previewed on the computer first and then exported to the board, so swapping in your own name, QR link or cat takes a few lines.",
      },
    ],
    tags: ["nRF52840", "OLED", "IMU", "픽셀 애니메이션"],
    thumb: "/thumbs/cat-card.jpg",
    images: ["/thumbs/cat-card.jpg"],
    videoUrl: "https://www.instagram.com/p/DeL3LX-ySHA/",
    liveUrl: null,
    addedAt: "2026-10-26",
    postedAt: "2026-10-07",
    draft: false,
  },
  {
    slug: "color-picker",
    no: 12,
    repo: "haeun2525/nu40-color-picker",
    title: { ko: "NU40DK 실물 컬러 피커", en: "NU40DK Real-Life Color Picker" },
    tagline: {
      ko: "카메라로 겨눈 곳의 색을 읽어, 동그란 화면을 그 색으로 채우고 색코드를 띄웁니다.",
      en: "Point the camera at anything and the round screen fills with that color and its hex code.",
    },
    body: [
      {
        ko: "길에서 본 간판, 나뭇잎, 벽 색을 그대로 색코드로 가져오는 손바닥만 한 스포이드예요. 겨누면 동그란 화면이 그 색으로 가득 차고 가운데에 #RRGGBB가 떠요.",
        en: "A palm-sized eyedropper for the real world: aim it at a sign, a leaf or a wall and the round screen fills with that color, with its #RRGGBB in the middle.",
      },
      {
        ko: "색센서 대신 작은 카메라를 씁니다. 카메라가 찍은 사진 한 장을 보드가 받아 풀고, 화면 한가운데 부분의 색을 평균 내요. 그래서 갖다 댈 필요 없이 30cm쯤 떨어져서 겨누면 됩니다.",
        en: "Instead of a color sensor it uses a small camera. The board receives one photo, decodes it and averages the colors in the center. So there's no need to touch the object — just aim from about 30cm away.",
      },
      {
        ko: "카메라 원래 색은 탁하고 빨강에 초록이 섞여 나와서, 기준이 되는 색 다섯 개를 재서 보정값을 맞췄어요. 지금은 빨강을 겨누면 빨강이 나옵니다.",
        en: "Raw camera colors came out dull, with green bleeding into red, so I measured five reference colors and fit a correction. Now red reads as red.",
      },
      {
        ko: "케이스도 직접 설계해서 3D 프린터로 뽑았어요. 화면은 내 쪽, 렌즈는 반대쪽에 같은 축으로 놓아서 화면 너머로 겨누면 그곳이 읽힙니다. 배터리를 넣어 선 없이 들고 다녀요.",
        en: "The case is my own design, 3D printed: screen facing you, lens on the opposite side on the same axis, so whatever is behind the screen is what gets read. With a battery inside it goes anywhere, cable-free.",
      },
    ],
    tags: ["nRF52840", "Grove Vision AI V2", "원형 LCD", "3D 프린트"],
    thumb: "/thumbs/color-picker.jpg",
    images: ["/thumbs/color-picker.jpg"],
    videoUrl: "https://www.instagram.com/p/De0sgXnyGo-/",
    liveUrl: null,
    addedAt: "2026-10-26",
    postedAt: "2026-10-22",
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
