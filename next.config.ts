import type { NextConfig } from "next";

/**
 * 모든 응답에 붙이는 보안 헤더.
 *
 * CSP 는 일부러 뺐다 — Next 가 인라인 스크립트를 쓰고 글꼴·사진이 바깥
 * (jsdelivr · googleapis · unsplash)에서 오기 때문에, nonce 를 붙이지 않고
 * 켜면 화면이 그냥 깨진다. 넣을 거면 따로 시간을 들여야 한다.
 */
const SECURITY_HEADERS = [
  // 남의 페이지가 이 사이트를 iframe 으로 감싸 PIN 입력을 가로채는 걸 막는다.
  // SAMEORIGIN 이라 /check.html 의 자기 출처 iframe 검사는 그대로 된다.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // 브라우저가 Content-Type 을 제멋대로 다시 추측하지 않게 한다
  { key: "X-Content-Type-Options", value: "nosniff" },
  // 바깥으로 나갈 때 주소 전체(쿼리 포함)를 넘기지 않는다
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // 이 사이트는 카메라·마이크·위치를 안 쓴다. 아예 잠가 둔다
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
