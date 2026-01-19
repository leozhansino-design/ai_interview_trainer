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

function SetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = (searchParams.get("mode") || "internet") as InterviewMode;

  const [position, setPosition] = useState("");
  const [company, setCompany] = useState("");
  const [round, setRound] = useState("business");
  const [duration, setDuration] = useState("30");
  const [category, setCategory] = useState("");
  const [techStack, setTechStack] = useState("");
  const [resumeContent, setResumeContent] = useState("");

  const positions = Object.keys(INTERNET_POSITIONS);
  const companies = position ? INTERNET_POSITIONS[position]?.companies || [] : [];
  const techStacks = Object.keys(TECH_CATEGORIES);

  useEffect(() => {
    if (position && companies.length > 0 && !companies.includes(company)) {
      setCompany(companies[0]);
    }
  }, [position, companies, company]);

  const getModeTitle = () => {
    const titles: Record<InterviewMode, string> = {
      internet: "互联网面试设置",
      civil: "公务员面试设置",
      behavioral: "行为面试设置",
      resume: "简历面试设置",
      tech: "技术面试设置",
    };
    return titles[mode];
  };

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
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-md w-full">
        <button
          onClick={() => router.push("/")}
          className="text-muted-foreground hover:text-foreground mb-8 text-sm"
        >
          ← 返回
        </button>

        <h1 className="text-2xl font-semibold text-center mb-8">
          {getModeTitle()}
        </h1>

        <div className="space-y-6">
          {/* 互联网面试 */}
          {mode === "internet" && (
            <>
              <div className="space-y-2">
                <Label>目标岗位</Label>
                <Select value={position} onValueChange={setPosition}>
                  <SelectTrigger>
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
                  <SelectTrigger>
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
                  <SelectTrigger>
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

          {/* 公务员面试 */}
          {mode === "civil" && (
            <div className="space-y-2">
              <Label>面试类型</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="选择类型" />
                </SelectTrigger>
                <SelectContent>
                  {CIVIL_CATEGORIES.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.label} - {c.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 行为面试 */}
          {mode === "behavioral" && (
            <div className="space-y-2">
              <Label>考察维度</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="选择维度" />
                </SelectTrigger>
                <SelectContent>
                  {BEHAVIORAL_CATEGORIES.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.label} - {c.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 简历模式 */}
          {mode === "resume" && (
            <>
              <div className="space-y-2">
                <Label>粘贴简历内容</Label>
                <Textarea
                  value={resumeContent}
                  onChange={(e) => setResumeContent(e.target.value)}
                  placeholder="将简历内容粘贴到这里..."
                  className="min-h-[200px]"
                />
              </div>

              <div className="space-y-2">
                <Label>目标岗位</Label>
                <Select value={position} onValueChange={setPosition}>
                  <SelectTrigger>
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
                  <SelectTrigger>
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
                    <SelectTrigger>
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

          {/* 面试时长 - 所有模式通用 */}
          <div className="space-y-3">
            <Label>面试时长</Label>
            <RadioGroup value={duration} onValueChange={setDuration} className="flex gap-4">
              {INTERVIEW_DURATIONS.map((d) => (
                <div key={d.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={d.id} id={d.id} />
                  <Label htmlFor={d.id} className="cursor-pointer">
                    {d.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <Button
            onClick={handleStart}
            disabled={!canStart()}
            className="w-full mt-8"
          >
            开始面试
          </Button>
        </div>
      </div>
    </main>
  );
}

export default function SetupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">加载中...</div>}>
      <SetupContent />
    </Suspense>
  );
}
