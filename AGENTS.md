<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->


## 화면 크기 (반응형)

**CSS 를 건드렸으면 `/check.html` 을 돌릴 것.** 320~1280 열다섯 폭 × 네 페이지를 훑어
겹침 · 가로넘침 · 덮여서 안 눌리는 것 · 손가락 크기(40px 미만)를 자동으로 잡는다.

```bash
npm run build && PORT=3011 npm start
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new \
  --virtual-time-budget=180000 --dump-dom http://localhost:3011/check.html | grep RESULT_JSON
```

* **`npm run dev` 로는 안 된다** — HMR 웹소켓이 안 끝나서 `--virtual-time-budget` 이 영원히 안 만료된다
* 헤드리스 크롬은 레이아웃 뷰포트가 500px 밑으로 안 내려가서, 검사 페이지가 iframe 안에 띄워 재는 것이다
* 헤드리스는 늘 `hover: hover` 라 **터치 전용 규칙은 검사에 안 걸린다.** 그래서 터치용 배치는
  `@media (hover: none), (max-width: 720px)` 처럼 폭 조건과 한 덩어리로 묶어 뒀다 — 갈라 쓰지 말 것
* `/shot.html` 은 같은 방식으로 폰 폭 화면을 눈으로 보는 페이지다
