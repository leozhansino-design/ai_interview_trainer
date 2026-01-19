"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const MAIN_MODES = [
  {
    id: "civil",
    title: "公务员/事业编面试",
    description: "结构化面试全真模拟",
    features: ["综合分析", "计划组织", "人际关系", "应急应变", "情景模拟"],
    gradient: "from-blue-600 to-cyan-500",
    popular: true,
  },
  {
    id: "behavioral",
    title: "行为面试 STAR",
    description: "500强企业面试必备",
    features: ["领导力", "团队协作", "解决问题", "抗压能力", "沟通表达"],
    gradient: "from-violet-600 to-purple-500",
    popular: true,
  },
];

const OTHER_MODES = [
  {
    id: "internet",
    title: "互联网大厂",
    description: "产品/运营/技术岗",
  },
  {
    id: "resume",
    title: "简历深挖",
    description: "针对你的简历提问",
  },
  {
    id: "tech",
    title: "技术八股",
    description: "Java/前端/后端",
  },
];

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-primary">AI 实时语音对练</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
              AI 面试官
            </span>
            <br />
            <span className="text-foreground">用真实压力，练出真本事</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            基于 GPT-4o 大模型，模拟真实面试官进行实时语音对练。
            <br />
            支持公务员结构化面试、行为面试等多种场景，AI 会根据你的回答实时追问。
          </p>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 mb-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">10000+</div>
              <div className="text-sm text-muted-foreground">练习次数</div>
            </div>
            <div className="w-px h-12 bg-border" />
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">98%</div>
              <div className="text-sm text-muted-foreground">好评率</div>
            </div>
            <div className="w-px h-12 bg-border" />
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">实时</div>
              <div className="text-sm text-muted-foreground">语音互动</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={() => router.push("/setup?mode=civil")}
              className="btn-gradient px-8 py-6 text-lg rounded-xl"
            >
              开始公务员面试
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/setup?mode=behavioral")}
              className="px-8 py-6 text-lg rounded-xl border-primary/50 hover:bg-primary/10"
            >
              开始行为面试
            </Button>
          </div>
        </div>
      </section>

      {/* Main Modes Section */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-2">热门面试类型</h2>
            <p className="text-muted-foreground">选择你要练习的面试场景</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {MAIN_MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => router.push(`/setup?mode=${mode.id}`)}
                className="group relative p-8 rounded-2xl bg-card border border-border card-hover text-left overflow-hidden"
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${mode.gradient} opacity-5 group-hover:opacity-10 transition-opacity`} />

                {/* Popular Badge */}
                {mode.popular && (
                  <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium">
                    热门
                  </div>
                )}

                <div className="relative z-10">
                  <h3 className="text-xl font-semibold mb-2">{mode.title}</h3>
                  <p className="text-muted-foreground mb-4">{mode.description}</p>

                  {/* Features */}
                  <div className="flex flex-wrap gap-2">
                    {mode.features.map((feature) => (
                      <span
                        key={feature}
                        className="px-3 py-1 rounded-full bg-secondary text-sm text-muted-foreground"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Other Modes Section */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold mb-2">更多面试类型</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {OTHER_MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => router.push(`/setup?mode=${mode.id}`)}
                className="p-6 rounded-xl bg-card border border-border card-hover text-left"
              >
                <h3 className="font-medium mb-1">{mode.title}</h3>
                <p className="text-sm text-muted-foreground">{mode.description}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-2">为什么选择 AI 面试官</h2>
            <p className="text-muted-foreground">区别于传统题库背诵的全新练习方式</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-card border border-border">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">实时语音对练</h3>
              <p className="text-sm text-muted-foreground">
                不是对着文字念答案，而是像真实面试一样用语音交流，AI 会根据你的回答实时追问
              </p>
            </div>

            <div className="p-6 rounded-xl bg-card border border-border">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">智能追问</h3>
              <p className="text-sm text-muted-foreground">
                基于 GPT-4o 大模型，能理解你的回答并进行深度追问，训练你的临场应变能力
              </p>
            </div>

            <div className="p-6 rounded-xl bg-card border border-border">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">详细评估报告</h3>
              <p className="text-sm text-muted-foreground">
                面试结束后生成详细评估报告，包括各维度评分和具体改进建议
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">准备好了吗？</h2>
          <p className="text-muted-foreground mb-8">
            现在开始你的第一次 AI 模拟面试，体验真实的面试压力
          </p>
          <Button
            onClick={() => router.push("/setup?mode=civil")}
            className="btn-gradient px-12 py-6 text-lg rounded-xl"
          >
            立即开始练习
          </Button>
        </div>
      </section>
    </div>
  );
}
