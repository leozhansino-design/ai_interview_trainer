"use client";

import { useRouter } from "next/navigation";
import { INTERVIEW_MODES } from "@/lib/config";

export default function Home() {
  const router = useRouter();

  const handleModeSelect = (modeId: string) => {
    router.push(`/setup?mode=${modeId}`);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-semibold text-foreground mb-3">
            AI模拟面试
          </h1>
          <p className="text-muted-foreground">
            用压力面试，练出真本事
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {INTERVIEW_MODES.slice(0, 3).map((mode) => (
            <button
              key={mode.id}
              onClick={() => handleModeSelect(mode.id)}
              className="group p-6 bg-card border border-border rounded-lg text-left hover:border-primary transition-colors"
            >
              <h2 className="text-lg font-medium text-foreground mb-2 group-hover:text-primary transition-colors">
                {mode.title}
              </h2>
              <p className="text-sm text-muted-foreground mb-1">
                {mode.description}
              </p>
              <p className="text-xs text-muted-foreground">
                {mode.detail}
              </p>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {INTERVIEW_MODES.slice(3).map((mode) => (
            <button
              key={mode.id}
              onClick={() => handleModeSelect(mode.id)}
              className="group p-6 bg-card border border-border rounded-lg text-left hover:border-primary transition-colors"
            >
              <h2 className="text-lg font-medium text-foreground mb-2 group-hover:text-primary transition-colors">
                {mode.title}
              </h2>
              <p className="text-sm text-muted-foreground mb-1">
                {mode.description}
              </p>
              <p className="text-xs text-muted-foreground">
                {mode.detail}
              </p>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
