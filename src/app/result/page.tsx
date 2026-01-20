"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import type { Message, InterviewResult, InterviewSettings } from "@/types";

function ResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<InterviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [settings, setSettings] = useState<InterviewSettings | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);

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
          { name: "表达清晰度", score: 0, comment: "没有对话记录" },
          { name: "逻辑结构", score: 0, comment: "没有对话记录" },
          { name: "专业深度", score: 0, comment: "没有对话记录" },
          { name: "应变能力", score: 0, comment: "没有对话记录" },
        ],
        suggestions: ["面试对话过短，无法生成有效评估"],
        highlights: [],
        overallComment: "这场面试几乎没有对话内容，请确保麦克风正常工作后重试。",
        transcript: msgs,
      });
      setLoading(false);
      return;
    }

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
      setResult({
        totalScore: 50,
        dimensions: [
          { name: "表达清晰度", score: 50, comment: "评估系统出错，这是临时分数" },
          { name: "逻辑结构", score: 45, comment: "评估系统出错，这是临时分数" },
          { name: "专业深度", score: 50, comment: "评估系统出错，这是临时分数" },
          { name: "应变能力", score: 47, comment: "评估系统出错，这是临时分数" },
        ],
        suggestions: [
          "🎯 评估系统暂时出了点问题",
          "🎯 建议稍后再试一次",
          "🎯 你可以先回顾一下对话记录自我评估",
        ],
        highlights: [],
        overallComment: "抱歉，AI评估系统出了点问题 😅 但你的练习记录已保存，可以查看对话记录进行自我复盘！",
        transcript: msgs,
      });
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    if (score >= 40) return "text-orange-400";
    return "text-red-400";
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return "from-green-500 to-emerald-400";
    if (score >= 60) return "from-yellow-500 to-orange-400";
    if (score >= 40) return "from-orange-500 to-red-400";
    return "from-red-500 to-rose-400";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "顶级表现 🌟";
    if (score >= 80) return "表现良好 👍";
    if (score >= 70) return "中等偏上";
    if (score >= 60) return "及格水平";
    if (score >= 40) return "需要加油 💪";
    if (score >= 20) return "差强人意 😅";
    return "emm...加油吧";
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <div className="absolute inset-2 border-4 border-cyan-400/20 rounded-full" />
            <div className="absolute inset-2 border-4 border-cyan-400 border-b-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
          </div>
          <p className="text-lg font-medium mb-2">AI 正在分析你的面试表现</p>
          <p className="text-sm text-muted-foreground">正在生成真实、客观的评估报告...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => router.push("/")} className="btn-gradient">返回首页</Button>
        </div>
      </main>
    );
  }

  const totalScore = result?.totalScore || 0;

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* 标题 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm mb-4">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            面试已完成
          </div>
          <h1 className="text-3xl font-bold mb-2">
            <span className="text-gradient">面试评估报告</span>
          </h1>
          <p className="text-muted-foreground">
            基于 AI 深度分析 · 真实客观评价
          </p>
        </div>

        {/* 总分卡片 */}
        <div className="card-gradient rounded-2xl p-8 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-2xl" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">总体评分</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-6xl font-bold bg-gradient-to-r ${getScoreGradient(totalScore)} bg-clip-text text-transparent`}>
                  {totalScore}
                </span>
                <span className="text-2xl text-muted-foreground">/100</span>
              </div>
              <div className={`inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full text-sm ${
                totalScore >= 80 ? "bg-green-500/20 text-green-400" :
                totalScore >= 60 ? "bg-yellow-500/20 text-yellow-400" :
                totalScore >= 40 ? "bg-orange-500/20 text-orange-400" :
                "bg-red-500/20 text-red-400"
              }`}>
                <span className="w-2 h-2 rounded-full bg-current" />
                {getScoreLabel(totalScore)}
              </div>
            </div>
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-muted/20"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="url(#scoreGradient)"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${totalScore * 3.52} 352`}
                  className="transition-all duration-1000"
                />
                <defs>
                  <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={totalScore >= 60 ? "#22c55e" : "#ef4444"} />
                    <stop offset="100%" stopColor={totalScore >= 60 ? "#06b6d4" : "#f97316"} />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold">{totalScore}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* 总评 */}
        {result?.overallComment && (
          <div className="card-gradient rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              AI 总评
            </h2>
            <p className="text-muted-foreground leading-relaxed">{result.overallComment}</p>
          </div>
        )}

        {/* 亮点 */}
        {result?.highlights && result.highlights.length > 0 && (
          <div className="card-gradient rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              表现亮点
            </h2>
            <div className="space-y-2">
              {result.highlights.map((highlight, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <span className="text-green-400">✓</span>
                  <p className="text-sm text-muted-foreground">{highlight}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 维度评分 */}
        <div className="card-gradient rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            能力维度分析
          </h2>
          <div className="space-y-5">
            {result?.dimensions.map((dim, index) => (
              <div key={dim.name} className="group">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-foreground font-medium">{dim.name}</span>
                  <span className={`font-semibold ${getScoreColor(dim.score)}`}>{dim.score}分</span>
                </div>
                <div className="relative h-3 bg-muted/30 rounded-full overflow-hidden mb-2">
                  <div
                    className={`absolute left-0 top-0 h-full rounded-full bg-gradient-to-r ${getScoreGradient(dim.score)} transition-all duration-1000`}
                    style={{ width: `${dim.score}%`, transitionDelay: `${index * 100}ms` }}
                  />
                </div>
                {dim.comment && (
                  <p className="text-xs text-muted-foreground pl-1">{dim.comment}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 改进建议 */}
        <div className="card-gradient rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            具体改进建议
          </h2>
          <div className="space-y-3">
            {result?.suggestions.map((suggestion, index) => (
              <div key={index} className="p-4 bg-muted/20 rounded-xl hover:bg-muted/30 transition-colors">
                <p className="text-sm text-muted-foreground leading-relaxed">{suggestion}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 面试记录 */}
        <div className="card-gradient rounded-2xl p-6 mb-6">
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="w-full flex items-center justify-between text-lg font-semibold"
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              面试对话记录
            </span>
            <svg className={`w-5 h-5 transition-transform ${showTranscript ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showTranscript && (
            <div className="mt-4 space-y-3 max-h-96 overflow-y-auto scrollbar-thin">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                    msg.role === "assistant"
                      ? "bg-primary/20 text-primary"
                      : "bg-cyan-500/20 text-cyan-400"
                  }`}>
                    {msg.role === "assistant" ? "AI" : "我"}
                  </div>
                  <div className={`flex-1 p-3 rounded-xl ${
                    msg.role === "assistant"
                      ? "bg-muted/30 mr-8"
                      : "bg-primary/20 ml-8"
                  }`}>
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    {msg.timestamp && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {messages.length === 0 && (
                <p className="text-center text-muted-foreground py-4">暂无对话记录</p>
              )}
            </div>
          )}
        </div>

        {/* 面试信息 */}
        {settings && (
          <div className="card-gradient rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              面试信息
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted/20 rounded-xl">
                <p className="text-xs text-muted-foreground mb-1">面试类型</p>
                <p className="font-medium">
                  {settings.mode === "civil" && "公务员面试"}
                  {settings.mode === "behavioral" && "行为面试"}
                  {settings.mode === "internet" && "互联网面试"}
                  {settings.mode === "tech" && "技术面试"}
                  {settings.mode === "resume" && "简历面试"}
                </p>
              </div>
              <div className="p-3 bg-muted/20 rounded-xl">
                <p className="text-xs text-muted-foreground mb-1">面试时长</p>
                <p className="font-medium">{settings.duration} 分钟</p>
              </div>
              {settings.position && (
                <div className="p-3 bg-muted/20 rounded-xl">
                  <p className="text-xs text-muted-foreground mb-1">目标岗位</p>
                  <p className="font-medium">{settings.position}</p>
                </div>
              )}
              {settings.company && (
                <div className="p-3 bg-muted/20 rounded-xl">
                  <p className="text-xs text-muted-foreground mb-1">目标公司</p>
                  <p className="font-medium">{settings.company}</p>
                </div>
              )}
              {settings.category && (
                <div className="p-3 bg-muted/20 rounded-xl col-span-2">
                  <p className="text-xs text-muted-foreground mb-1">面试分类</p>
                  <p className="font-medium">{settings.category}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="grid grid-cols-3 gap-3">
          <Button
            variant="outline"
            className="flex flex-col items-center gap-1 h-auto py-4 border-muted/50 hover:bg-muted/20"
            onClick={() => router.push("/")}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs">返回首页</span>
          </Button>
          <Button
            className="btn-gradient flex flex-col items-center gap-1 h-auto py-4"
            onClick={() => {
              if (settings) {
                const encoded = encodeURIComponent(JSON.stringify(settings));
                router.push(`/interview?settings=${encoded}`);
              } else {
                router.push("/");
              }
            }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="text-xs">再来一次</span>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col items-center gap-1 h-auto py-4 border-muted/50 hover:bg-muted/20"
            onClick={() => router.push("/setup?mode=" + (settings?.mode || "civil"))}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <span className="text-xs">换个模式</span>
          </Button>
        </div>

        {/* 底部提示 */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            真诚的批评是最好的帮助，每一次练习都让你更接近目标 💪
          </p>
        </div>
      </div>
    </main>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    }>
      <ResultContent />
    </Suspense>
  );
}
