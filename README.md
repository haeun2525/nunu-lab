# nunu-lab

[@physical_nunu](https://www.instagram.com/physical_nunu) 채널에서 만든 것들을 모아 두고,
사람들이 코드를 가져갈 수 있게 하는 사이트.

```
홈       우주 배경 위에 픽셀 캐릭터가 떠다닌다. 오브젝트 3개를 눌러 각 탭·스토어로 간다.
저장소   프로젝트 갤러리. 카드를 누르면 상세가 열리고, 거기서 깃허브로 넘어간다.
방명록   익명/실명으로 남기는 방명록.
```

## 실행

```bash
npm install
npm run dev          # http://localhost:3000
```

환경변수 없이도 전부 돌아간다. 다만 **카운터·댓글이 서버 메모리에만 쌓여서 재시작하면 사라진다.**
영속화하려면 아래 Supabase 설정을 하면 된다.

## Supabase 연결

1. [supabase.com](https://supabase.com) 에서 프로젝트를 만든다.
2. SQL Editor 에 [`supabase/schema.sql`](supabase/schema.sql) 을 통째로 붙여넣고 실행한다.
3. `.env.local` 을 만들고 두 값을 채운다. (`.env.example` 참고)

```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

`service_role` 키는 **서버(라우트 핸들러)에서만** 쓴다. `NEXT_PUBLIC_` 접두사를 붙이지 말 것 —
붙이면 브라우저 번들에 실려서 아무나 DB를 건드릴 수 있게 된다.

Supabase 는 클라이언트 라이브러리 없이 PostgREST 를 `fetch` 로 직접 호출한다.
의존성을 늘리지 않으려고 일부러 그렇게 했다. → [`lib/db.ts`](lib/db.ts)

## UTM 클릭 집계

외부로 나가는 링크는 전부 `/go/<slug>` 를 거친다. 이 라우트가 클릭을 세고 UTM 을 붙여 302 로 보낸다.

```
/go/music-led?from=gallery
  → https://github.com/haeun2525/nu40dk_music_led
      ?utm_source=nunu-lab
      &utm_medium=gallery      # from 파라미터가 그대로 들어간다
      &utm_campaign=music-led
      &utm_content=repo-link
```

`slug` 가 `store` 면 NU40DK 스토어로 간다. 집계가 실패해도 이동은 막지 않는다.

방문자수는 쿠키로 **하루 한 번만** 센다. → [`app/api/visit/route.ts`](app/api/visit/route.ts)

## 프로젝트 추가하기

[`lib/projects.ts`](lib/projects.ts) 배열에 한 덩어리 추가하고, 썸네일을 `public/thumbs/` 에 넣으면 끝이다.

**`draft: true` 면 갤러리·상세·`/go` 어디에도 안 뜬다.** 릴스가 아직 안 올라간 건은 이걸로 막아 둔다.
공개할 때 `false` 로 바꾸고 깃허브 레포도 같이 public 으로 돌리면 된다.

## 손댈 만한 곳

| 무엇 | 어디 |
|---|---|
| 배경 망점 밀도·색 | `components/RasterHero.tsx` 상단 `CELL` `LIFT` |
| 마우스 글리치 세기 | 〃 `PUSH` `STREAK` `EASE` |
| 떠다니는 캐릭터 | `components/FloatingChars.tsx` — `CHARS` 배열, `RADIUS` `FORCE` `STIFF` `DAMP` |
| 배경 빛 덩어리 | `app/globals.css` 의 `.b1` `.b2` `.b3` |
| 팔로우 팝업 빈도 | `components/FollowGate.tsx` 의 `ONCE_PER_SESSION` |
| 한글/영문 문구 | `lib/i18n.ts` |

## 알아 둘 것

- **`body` 에 배경색을 주면 안 된다.** CSS 페인트 순서상 `body` 배경이 음수 z-index 레이어
  (`.space-bg`, 래스터 캔버스)를 덮어 버린다. 배경색은 `html` 에만 둔다.
- **`.detail` 에 `padding` 단축을 쓰면 안 된다.** `.shell` 의 좌우 패딩이 0 으로 덮여서
  다른 페이지와 정렬이 어긋난다. `padding-block` 을 쓸 것.
- 갈무리는 비트맵 계열 글꼴이라 소수점 크기에서 뭉갠다. 정수 px 로만 쓴다.

## 만든 것들

Next.js 16 (App Router) · Supabase(PostgREST) · Galmuri · Pretendard
