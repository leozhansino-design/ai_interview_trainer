"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  INTERNET_POSITIONS,
  INTERVIEW_ROUNDS,
  INTERVIEW_DURATIONS,
  CIVIL_CATEGORIES,
  BEHAVIORAL_CATEGORIES,
  TECH_CATEGORIES,
} from "@/lib/config";
import type { InterviewMode } from "@/types";

const MODE_INFO: Record<InterviewMode, { title: string; description: string; icon: string }> = {
  civil: {
    title: "公务员/事业编面试",
    description: "结构化面试全真模拟，包含综合分析、计划组织等六大题型",
    icon: "🏛️",
  },
  behavioral: {
    title: "行为面试 STAR",
    description: "考察领导力、团队协作等软素质，适用于各类企业面试",
    icon: "🎯",
  },
  internet: {
    title: "互联网大厂面试",
    description: "模拟 BAT 等互联网公司的真实面试场景",
    icon: "💼",
  },
  resume: {
    title: "简历深挖面试",
    description: "根据你的简历进行针对性提问，深挖项目经历",
    icon: "📄",
  },
  tech: {
    title: "技术八股文",
    description: "Java、前端、后端等技术岗位面试题目",
    icon: "💻",
  },
};

function SetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = (searchParams.get("mode") || "civil") as InterviewMode;

  const [position, setPosition] = useState("");
  const [company, setCompany] = useState("");
  const [round, setRound] = useState("business");
  const [duration, setDuration] = useState("15");
  const [category, setCategory] = useState("");
  const [techStack, setTechStack] = useState("");
  const [resumeContent, setResumeContent] = useState("");

  const positions = Object.keys(INTERNET_POSITIONS);
  const companies = position ? INTERNET_POSITIONS[position]?.companies || [] : [];
  const techStacks = Object.keys(TECH_CATEGORIES);
  const modeInfo = MODE_INFO[mode];

  useEffect(() => {
    if (position && companies.length > 0 && !companies.includes(company)) {
      setCompany(companies[0]);
    }
  }, [position, companies, company]);

  // 公务员和行为面试默认选中第一个分类
  useEffect(() => {
    if (mode === "civil" && !category && CIVIL_CATEGORIES.length > 0) {
      setCategory(CIVIL_CATEGORIES[0].id);
    }
    if (mode === "behavioral" && !category && BEHAVIORAL_CATEGORIES.length > 0) {
      setCategory(BEHAVIORAL_CATEGORIES[0].id);
    }
  }, [mode, category]);

  const handleStart = () => {
    const settings = {
      mode,
      position,
      company,
      round,
      duration: parseInt(duration),
      category,
      techStack,
      resumeContent,
    };

    const encoded = encodeURIComponent(JSON.stringify(settings));
    router.push(`/interview?settings=${encoded}`);
  };

  const canStart = () => {
    switch (mode) {
      case "internet":
        return position && company;
      case "civil":
        return category;
      case "behavioral":
        return category;
      case "resume":
        return resumeContent.trim().length > 0;
      case "tech":
        return techStack && category;
      default:
        return false;
    }
  };

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* 返回按钮 */}
        <button
          onClick={() => router.push("/")}
          className="text-muted-foreground hover:text-foreground mb-6 text-sm flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回首页
        </button>

        {/* 模式信息卡片 */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="text-4xl">{modeInfo.icon}</div>
            <div>
              <h1 className="text-xl font-semibold mb-1">{modeInfo.title}</h1>
              <p className="text-sm text-muted-foreground">{modeInfo.description}</p>
            </div>
          </div>
        </div>

        {/* 设置表单 */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
          {/* 公务员面试 - 分类选择 */}
          {mode === "civil" && (
            <div className="space-y-3">
              <Label className="text-base font-medium">选择题型</Label>
              <div className="grid grid-cols-2 gap-3">
                {CIVIL_CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCategory(c.id)}
                    className={`p-4 rounded-xl text-left transition-all ${
                      category === c.id
                        ? "bg-primary/10 border-2 border-primary"
                        : "bg-secondary border-2 border-transparent hover:border-primary/30"
                    }`}
                  >
                    <div className="font-medium text-sm">{c.label}</div>
                    <div className="text-xs text-muted-foreground mt-1">{c.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 行为面试 - 维度选择 */}
          {mode === "behavioral" && (
            <div className="space-y-3">
              <Label className="text-base font-medium">选择考察维度</Label>
              <div className="grid grid-cols-2 gap-3">
                {BEHAVIORAL_CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCategory(c.id)}
                    className={`p-4 rounded-xl text-left transition-all ${
                      category === c.id
                        ? "bg-primary/10 border-2 border-primary"
                        : "bg-secondary border-2 border-transparent hover:border-primary/30"
                    }`}
                  >
                    <div className="font-medium text-sm">{c.label}</div>
                    <div className="text-xs text-muted-foreground mt-1">{c.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 互联网面试 */}
          {mode === "internet" && (
            <>
              <div className="space-y-2">
                <Label>目标岗位</Label>
                <Select value={position} onValueChange={setPosition}>
                  <SelectTrigger className="bg-secondary">
                    <SelectValue placeholder="选择岗位" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>目标公司</Label>
                <Select value={company} onValueChange={setCompany} disabled={!position}>
                  <SelectTrigger className="bg-secondary">
                    <SelectValue placeholder="选择公司" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>面试轮次</Label>
                <Select value={round} onValueChange={setRound}>
                  <SelectTrigger className="bg-secondary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INTERVIEW_ROUNDS.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* 简历模式 */}
          {mode === "resume" && (
            <>
              <div className="space-y-2">
                <Label>粘贴简历内容</Label>
                <Textarea
                  value={resumeContent}
                  onChange={(e) => setResumeContent(e.target.value)}
                  placeholder="将简历内容粘贴到这里，AI 会根据你的简历进行针对性提问..."
                  className="min-h-[200px] bg-secondary resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  建议不超过 2000 字，重点包含工作经历和项目经验
                </p>
              </div>

              <div className="space-y-2">
                <Label>目标岗位（可选）</Label>
                <Select value={position} onValueChange={setPosition}>
                  <SelectTrigger className="bg-secondary">
                    <SelectValue placeholder="选择岗位" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* 技术面试 */}
          {mode === "tech" && (
            <>
              <div className="space-y-2">
                <Label>技术方向</Label>
                <Select value={techStack} onValueChange={(v) => { setTechStack(v); setCategory(""); }}>
                  <SelectTrigger className="bg-secondary">
                    <SelectValue placeholder="选择技术方向" />
                  </SelectTrigger>
                  <SelectContent>
                    {techStacks.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {techStack && (
                <div className="space-y-2">
                  <Label>细分领域</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="bg-secondary">
                      <SelectValue placeholder="选择细分领域" />
                    </SelectTrigger>
                    <SelectContent>
                      {TECH_CATEGORIES[techStack]?.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}

          {/* 面试时长 */}
          <div className="space-y-3 pt-4 border-t border-border">
            <Label className="text-base font-medium">面试时长</Label>
            <RadioGroup value={duration} onValueChange={setDuration} className="flex gap-3">
              {INTERVIEW_DURATIONS.map((d) => (
                <label
                  key={d.id}
                  className={`flex-1 flex flex-col items-center p-4 rounded-xl cursor-pointer transition-all ${
                    duration === d.id
                      ? "bg-primary/10 border-2 border-primary"
                      : "bg-secondary border-2 border-transparent hover:border-primary/30"
                  }`}
                >
                  <RadioGroupItem value={d.id} id={d.id} className="sr-only" />
                  <span className="font-semibold">{d.label}</span>
                  <span className="text-xs text-muted-foreground">{d.points} 积分</span>
                </label>
              ))}
            </RadioGroup>
          </div>

          {/* 开始按钮 */}
          <Button
            onClick={handleStart}
            disabled={!canStart()}
            className="w-full btn-gradient py-6 text-lg rounded-xl mt-4"
          >
            开始面试
          </Button>
        </div>

        {/* 提示信息 */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>面试开始后，AI 面试官会自动提问</p>
          <p>你可以随时结束面试，系统会生成评估报告</p>
        </div>
      </div>
    </main>
  );
}

export default function SetupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    }>
      <SetupContent />
    </Suspense>
  );
}
