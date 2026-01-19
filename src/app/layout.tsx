import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ParticleBackground from "@/components/layout/ParticleBackground";

export const metadata: Metadata = {
  title: "AI面试官 - 智能模拟面试系统",
  description: "基于AI大模型的智能面试模拟系统，支持公务员结构化面试、行为面试等多种场景练习",
  keywords: "AI面试,模拟面试,公务员面试,行为面试,面试练习",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased min-h-screen flex flex-col tech-grid">
        <ParticleBackground />
        <Header />
        <main className="flex-1 pt-16 relative z-10">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
