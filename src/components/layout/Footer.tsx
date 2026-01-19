"use client";

import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  // 面试进行中不显示 Footer
  if (pathname === "/interview") {
    return null;
  }

  return (
    <footer className="border-t border-border/50 bg-background/80 backdrop-blur-md mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              <span className="font-semibold text-lg">面试官</span>
            </div>
            <p className="text-muted-foreground text-sm max-w-md">
              基于 AI 大模型的智能面试模拟系统，提供公务员结构化面试、行为面试等多种场景练习，
              帮助你在真实面试中脱颖而出。
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-medium mb-4">面试类型</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="/setup?mode=civil" className="hover:text-primary transition-colors">
                  公务员面试
                </a>
              </li>
              <li>
                <a href="/setup?mode=behavioral" className="hover:text-primary transition-colors">
                  行为面试
                </a>
              </li>
              <li>
                <a href="/setup?mode=internet" className="hover:text-primary transition-colors">
                  互联网面试
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-medium mb-4">联系我们</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>微信客服：待添加</li>
              <li>问题反馈：待添加</li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm">
            © 2024 AI面试官. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              系统正常运行
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
