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
   그다음 `supabase/002_events.sql` · `003_notice.sql` · `004_project_edits.sql` 도 차례로 실행한다.
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

`slug` 가 `store` 면 NU40DK 스토어(네이버 스마트스토어)로 간다. 집계가 실패해도 이동은 막지 않는다.
`STORE_URL` 에는 UTM 도, 검색으로 들어갔을 때 붙는 `NaPm`·`nl-ts-pid` 같은 것도 넣지 않는다 —
그건 그 사람의 클릭 기록이고, UTM 은 `/go` 가 붙인다.

방문자수는 쿠키로 **하루 한 번만** 센다. → [`app/api/visit/route.ts`](app/api/visit/route.ts)

## 어디서 왔는지 알아내기

**서버가 받는 `referer` 로는 유입원을 알 수 없다.** `VisitPing` 이 사이트 안에서 `/api/visit` 를
부르기 때문에 항상 우리 도메인이 찍힌다. 그래서 클라이언트가 `document.referrer` 와 주소창의
`utm_*` 를 직접 실어 보낸다. `/go` 링크도 `rel="noopener noreferrer"` 라 referer 가 안 남는다.

**referrer 보다 UTM 이 정확하다.** 인스타 앱 안 브라우저는 referrer 를 안 보내는 경우가 많다.
프로필 링크를 이렇게 걸어 두면 확정값으로 잡힌다.

```
https://nunu-lab.vercel.app/?utm_source=instagram&utm_medium=bio
https://nunu-lab.vercel.app/?utm_source=instagram&utm_medium=bio&utm_content=lyrics
                                                              ↑ 지금 미는 영상. 바꿔 달면 그 영상 몫이 갈린다
```

`utm_content` 는 릴스를 새로 올릴 때마다 갈아 끼우는 칸이다. 인스타는 게시물마다 링크를 못 다니까,
**프로필 링크의 `utm_content` 를 그때그때 바꾸는 게 사실상 유일한 방법이다.**

## 한 번 들른 동안의 이동 보기

```bash
npm run stats -- --flow
```

```
08-25 10:28  desktop  유입:instagram  머문시간:36초
  /  /repo  /repo/lyrics  → 나감:lyrics
```

`session` 은 **30분짜리 임시 난수**다. 30분 쉬면 같은 사람도 다른 값이 되고 날짜를 넘겨 이어
붙일 수 없다. 개인 식별자가 아니고, IP·전체 UA·전체 referrer 는 **여전히 저장하지 않는다.**

쓰려면 [`supabase/005_events_context.sql`](supabase/005_events_context.sql) 을 한 번 실행해야 한다.
안 돌린 상태에서도 사이트와 방문 집계는 그대로 돈다 — 새 칸이 없으면 예전 모양으로 넣고
페이지 이동 기록만 버린다. → `logEvent()` 안의 폴백

## 운영자 모드 — 문구를 화면에서 고치기

화면 오른쪽 아래 구석에 점이 하나 있다. 눌러서 PIN(`.env.local` 의 `ADMIN_PASSWORD`)을 넣으면
운영자 모드가 켜지고, 저장소 상세 페이지 제목 옆에 ✎ 가 붙는다. 거기서 고칠 수 있는 것:

```
제목 · 한 줄 소개 · 소개글 문단 · 태그 · 영상 링크 · 인스타 업로드일
```

한국어·영어를 각각 저장한다. 사진은 파일이라 여기서 못 바꾼다.

**고친 건 `lib/projects.ts` 를 덮어쓰지 않는다.** 배포된 서버는 파일을 못 고치니까
(Vercel 파일시스템은 읽기 전용) 수정분만 `project_edits` 표에 쌓고, 화면에 내보낼 때
파일 위에 얹는다. → [`lib/projects-server.ts`](lib/projects-server.ts)

- 쓰려면 [`supabase/004_project_edits.sql`](supabase/004_project_edits.sql) 을 SQL Editor 에 한 번 실행해야 한다.
  표가 없으면 **사이트는 멀쩡히 뜨고 파일 문구가 그대로 나오지만, 저장만 실패한다.**
- **파일을 고쳤는데 화면이 안 바뀌면** 그 프로젝트에 화면에서 고친 게 남아 있는 것이다.
  편집기의 `원래대로` 를 누르면 파일 내용으로 돌아온다.
- 공지 배너와 자물쇠가 같다. 한쪽에서 PIN 을 넣으면 다른 쪽도 열린다. → [`lib/admin.ts`](lib/admin.ts)
- PIN 을 바꾸면 이미 심어 둔 쿠키가 전부 무효가 된다. (쿠키 값이 PIN 에서 나온다)
- **틀린 PIN 은 열 번까지다.** 연달아 열 번 틀리면 그 IP 를 10분 잠근다.
  잠긴 동안에는 **맞는 PIN 도 안 받는다** — 그래야 잠근 의미가 있다.
  내가 잠겼으면 10분 기다리거나, 급하면 Vercel 에서 재배포하면 풀린다(기록이 메모리라서).
  기록이 서버 인스턴스 메모리라 인스턴스가 늘면 잠금이 따로 논다 —
  한 대를 붙잡고 늘어지는 걸 막는 정도다. **자릿수를 늘리는 게 가장 크게 먹는다.**
- PIN 을 받는 곳은 전부 `tryPin()` 을 지난다. `checkPassword` 는 밖으로 안 내보낸다 —
  직접 부르면 시도 제한을 건너뛰게 된다

## 프로젝트 추가하기

[`lib/projects.ts`](lib/projects.ts) 배열에 한 덩어리 추가하고, 썸네일을 `public/thumbs/` 에 넣으면 끝이다.

**`draft: true` 면 갤러리·상세·`/go` 어디에도 안 뜬다.** 릴스가 아직 안 올라간 건은 이걸로 막아 둔다.
공개할 때 `false` 로 바꾸고 깃허브 레포도 같이 public 으로 돌리면 된다.

**브라우저에서 바로 되는 게 있으면 `liveUrl` 을 적는다.** 그러면 상세에 `바로 사용해보기` 가
깃허브 버튼보다 **먼저** 뜬다. 코드보다 직접 써 보는 게 핵심인 것에만 붙인다 (예: `face-mirror`).
이 칸은 운영자 모드에서 못 고친다 — 파일에서만 바꾼다.

```
/go/face-mirror?to=live&from=detail
  → https://nu40-face-mirror.vercel.app?utm_content=live-link
```

클릭은 `face-mirror:live` 라는 **다른 이름**으로 쌓인다. 갤러리 카드의 ↗ 숫자(깃허브 이동)와 섞이지 않는다.

문구는 여기 적힌 게 원본이고, 운영자 모드에서 고친 게 있으면 그쪽이 이긴다. (위 참고)

## 손댈 만한 곳

| 무엇 | 어디 |
|---|---|
| 배경 망점 밀도·색 | `components/RasterHero.tsx` 상단 `CELL` `LIFT` |
| 마우스 글리치 세기 | 〃 `PUSH` `STREAK` `EASE` |
| 떠다니는 캐릭터 | `components/FloatingChars.tsx` — `CHARS` 배열, `RADIUS` `FORCE` `STIFF` `DAMP` |
| 배경 빛 덩어리 | `app/globals.css` 의 `.b1` `.b2` `.b3` |
| 팔로우 팝업 빈도 | `components/FollowGate.tsx` 의 `ONCE_PER_SESSION` |
| 한글/영문 문구 | `lib/i18n.ts` |
| 구석 운영자 버튼 위치·크기 | `app/globals.css` 의 `.adm-dot` |

## 알아 둘 것

- **`body` 에 배경색을 주면 안 된다.** CSS 페인트 순서상 `body` 배경이 음수 z-index 레이어
  (`.space-bg`, 래스터 캔버스)를 덮어 버린다. 배경색은 `html` 에만 둔다.
- **`.detail` 에 `padding` 단축을 쓰면 안 된다.** `.shell` 의 좌우 패딩이 0 으로 덮여서
  다른 페이지와 정렬이 어긋난다. `padding-block` 을 쓸 것.
- 갈무리는 비트맵 계열 글꼴이라 소수점 크기에서 뭉갠다. 정수 px 로만 쓴다.
- **환경변수 없이 `npm run dev` 로 돌릴 때는 저장해도 화면이 안 바뀐다.** 폴백 저장소가
  프로세스 메모리인데 라우트 핸들러와 페이지 렌더가 서로 다른 모듈 인스턴스를 잡아서 그렇다.
  API 응답은 제대로 온다. 화면까지 확인하려면 Supabase 를 붙이고 볼 것. (공지 배너도 똑같다)

## 만든 것들

Next.js 16 (App Router) · Supabase(PostgREST) · Galmuri · Pretendard

## 대시보드와 매일 리포트 (2026-08-26 추가)

**두 사이트(누누랩 · howcanisayit)를 한 장으로 본다.** 둘이 같은 Supabase 프로젝트에 살고
표 이름만 다르기 때문에(`events` / `ax_events`) 여기 한 곳에서 둘 다 읽는다 — `lib/db.ts` 의 `SITES`.
합치는 곳은 `lib/daily.ts` 하나뿐이고, 대시보드·RSS·메일이 전부 그걸 부른다.

**사람 수 합계는 겹칠 수 있는 값이다.** 소금값을 사이트마다 다르게 뒀기 때문에
같은 사람이라도 두 사이트에서 다른 해시가 된다. 일부러 그렇게 한 것이고, 화면에도 그렇게 적어 뒀다.

* `/insight` — 운영자 전용. 합본 숫자 + **자동 점검** + 사이트별 상세.
  그날의 사람 수(새/재방문) · 방문 · 체류시간 중앙값 ·
  한 장만 보고 나간 비율 · 유입 · 지역 · 기기 · 페이지 · 클릭, 그리고 **여정 전부**를 보여 준다
* **`/api/report/rss?key=$CRON_SECRET` 가 합본 피드다. 열쇠 없이는 401 이다.**
  피드에는 방문자 해시·지역·머문 시각·여정이 통째로 들어 있어서 `/insight` 와 내용이 같다 —
  열어 두면 그쪽 PIN 이 무의미해진다. **주소만 감추는 건 잠근 게 아니다.**
  구독은 이 주소 하나만 하면 된다 (howcanisayit 쪽 피드는
  그 사이트 것만 담긴 별개다 — 둘 다 구독하면 메일이 두 번 온다).
  어제치는 **오늘 09시(KST)에 피드에 나타난다.** 그 시각이 곧 메일이 오는 시각이다
* Power Automate 에서 "RSS 항목이 게시되면 → 메일 보내기" 흐름 하나면 끝난다.
  RSS 트리거도 Outlook 메일도 **기본 커넥터라 유료가 아니다**
* `/api/report/daily` 는 Teams 웹훅이나 Resend 키를 넣었을 때만 실제로 보낸다
* `?day=2026-08-25` 로 날짜 지정, `?dry=1` 이면 보내지 않고 JSON 만 본다
* **집계는 `lib/report.ts` 하나만 쓴다** — 화면과 리포트가 다른 숫자를 말하면 둘 다 못 믿는다

**방문자 구분은 IP 해시로 한다.** IP 원문은 저장하지 않고 `ANALYTICS_SALT` 를 섞은
sha256 앞 16자만 남긴다. 해시로 IP 를 되돌릴 수 없고, 소금값을 갈면 이전 기록과 사람이 안 이어진다.
howcanisayit 과는 **일부러 다른 소금값**을 쓴다 — 같으면 두 사이트 방문자가 서로 이어져 버린다.

**내 접속은 안 센다.** 운영자 쿠키가 있거나 referer 가 `vercel.com` 이면 `isOwnVisit` 이 걸러낸다.

**RLS 는 `supabase/007_rls.sql` 로 켠다** (howcanisayit 쪽 표는 그 저장소의 `004_rls.sql`).
켜도 사이트는 안 깨진다 — 붙는 앱 셋이 전부 서버에서 service_role 로만 붙고 그건 RLS 를 통과한다.
브라우저에서 Supabase 를 직접 부르는 코드는 한 줄도 없다. **나중에 브라우저에서 직접 읽는
화면을 만들면 그때 표마다 정책을 써 줘야 한다.**

새 칸은 `supabase/006_visitor.sql` 을 SQL Editor 에 붙여넣어야 생긴다.
안 돌려도 집계가 멎지는 않는다 — 새 모양 → 그 전 모양 → 맨 처음 모양 순으로 물러나 저장한다.

### 자동 점검 (AI 안 쓴다)

`lib/report.ts` 의 `diagnose()` 가 **숫자 모양만 보고** 짚는다 — API 키도 모델도 안 쓴다.
지금 잡는 것: 열람은 있는데 사람이 0명(해시가 안 붙음) · 체류시간이 전부 0(떠날 때 신호 없음) ·
이탈률 80% 이상 · 사람은 왔는데 클릭 0 · utm_content 가 한 종류뿐 · 1초 이내 방문이 절반 이상(봇 의심).
**해석은 사람이 한다.** 여기 뜨는 문장은 전부 사실 진술이지 판단이 아니다.
