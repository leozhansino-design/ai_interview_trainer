import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI模拟面试 - 用压力面试，练出真本事",
  description: "基于AI的模拟面试平台，支持互联网、公务员、行为面试等多种模式",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
