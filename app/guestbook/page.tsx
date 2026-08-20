import Guestbook from "@/components/Guestbook";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "방명록 | 누누",
  description: "익명이든 실명이든, 편하게 남기고 가세요.",
};

export default function Page() {
  return <Guestbook />;
}
