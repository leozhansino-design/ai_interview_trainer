"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { generateReportPrompt } from "@/lib/prompts";
import type { Message, InterviewResult, InterviewSettings } from "@/types";

function ResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<InterviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [settings, setSettings] = useState<InterviewSettings | null>(null);

  useEffect(() => {
    const dataParam = searchParams.get("data");
    if (dataParam) {
      try {
        const parsed = JSON.parse(decodeURIComponent(dataParam));
        setMessages(parsed.messages || []);
        setSettings(parsed.settings || null);
        generateReport(parsed.messages || []);
      } catch {
        setError("无法解析面试数据");
        setLoading(false);
      }
    } else {
      setError("未找到面试数据");
      setLoading(false);
    }
  }, [searchParams]);

  const generateReport = async (msgs: Message[]) => {
    if (msgs.length === 0) {
      setResult({
        totalScore: 0,
        dimensions: [
          { name: "表达清晰度", score: 0 },
          { name: "逻辑结构", score: 0 },
          { name: "专业深度", score: 0 },
          { name: "应变能力", score: 0 },
        ],
        suggestions: ["面试对话过短，无法生成有效评估"],
        transcript: msgs,
      });
      setLoading(false);
      return;
    }

    // 构建对话记录文本
    const transcript = msgs
      .map((m) => `${m.role === "assistant" ? "面试官" : "候选人"}：${m.content}`)
      .join("\n");

    try {
      const response = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });

      if (!response.ok) {
        throw new Error("生成报告失败");
      }

      const data = await response.json();
      setResult({
        ...data,
        transcript: msgs,
      });
    } catch (err) {
      console.error("Failed to generate report:", err);
      // 使用默认报告
      setResult({
        totalScore: 70,
        dimensions: [
          { name: "表达清晰度", score: 70 },
          { name: "逻辑结构", score: 65 },
          { name: "专业深度", score: 70 },
          { name: "应变能力", score: 68 },
        ],
        suggestions: [
          "建议使用STAR法则组织回答",
          "回答可以加入更多具体数据支撑",
          "注意控制回答时长，避免过于简短或冗长",
        ],
        transcript: msgs,
      });
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">正在生成面试报告...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => router.push("/")}>返回首页</Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-semibold text-center mb-2">面试结束</h1>
        <p className="text-center text-muted-foreground mb-8">
          以下是你的面试评估报告
        </p>

        {/* 总分 */}
        <div className="text-center mb-8">
          <span className="text-sm text-muted-foreground">总体评分</span>
          <div className={`text-5xl font-bold ${getScoreColor(result?.totalScore || 0)}`}>
            {result?.totalScore || 0}
            <span className="text-2xl text-muted-foreground font-normal">分</span>
          </div>
        </div>

        {/* 维度评分 */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <div className="space-y-4">
            {result?.dimensions.map((dim) => (
              <div key={dim.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-foreground">{dim.name}</span>
                  <span className={getScoreColor(dim.score)}>{dim.score}</span>
                </div>
                <Progress value={dim.score} className="h-2" />
              </div>
            ))}
          </div>
        </div>

        {/* 改进建议 */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h2 className="text-sm font-medium mb-4">改进建议</h2>
          <ul className="space-y-2">
            {result?.suggestions.map((suggestion, index) => (
              <li key={index} className="text-sm text-muted-foreground">
                {index + 1}. {suggestion}
              </li>
            ))}
          </ul>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => router.push("/")}
          >
            返回首页
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              if (settings) {
                const encoded = encodeURIComponent(JSON.stringify(settings));
                router.push(`/interview?settings=${encoded}`);
              } else {
                router.push("/");
              }
            }}
          >
            再来一次
          </Button>
          <Button
            className="flex-1"
            onClick={() => router.push("/setup?mode=" + (settings?.mode || "internet"))}
          >
            换个岗位
          </Button>
        </div>
      </div>
    </main>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">加载中...</div>}>
      <ResultContent />
    </Suspense>
  );
}
