"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  // 面试进行中不显示 Header
  if (pathname === "/interview") {
    return null;
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">AI</span>
          </div>
          <span className="font-semibold text-lg">面试官</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className={`text-sm transition-colors ${
              pathname === "/" ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            首页
          </Link>
          <Link
            href="/setup?mode=civil"
            className={`text-sm transition-colors ${
              pathname.includes("civil") ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            公务员面试
          </Link>
          <Link
            href="/setup?mode=behavioral"
            className={`text-sm transition-colors ${
              pathname.includes("behavioral") ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            行为面试
          </Link>
        </nav>

        {/* CTA Button */}
        <Link
          href="/"
          className="btn-gradient px-4 py-2 rounded-lg text-sm font-medium text-white"
        >
          开始练习
        </Link>
      </div>
    </header>
  );
}
