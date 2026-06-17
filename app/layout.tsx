import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "시장에 가면 - 합리적 장보기 게임",
  description: "합리적 소비와 기회비용을 배우는 심부름 게임",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}
