"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { AudioRecorder, AudioPlayer, encodeAudioToBase64 } from "@/lib/audio";
import { generateInterviewPrompt } from "@/lib/prompts";
import { INTERVIEWER_STYLES } from "@/lib/config";
import type { InterviewSettings, Message } from "@/types";

function InterviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [settings, setSettings] = useState<InterviewSettings | null>(null);
  const [status, setStatus] = useState<"idle" | "connecting" | "active" | "ending">("idle");
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [remainingTime, setRemainingTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 解析设置
  useEffect(() => {
    const settingsParam = searchParams.get("settings");
    if (settingsParam) {
      try {
        const parsed = JSON.parse(decodeURIComponent(settingsParam));
        setSettings(parsed);
        setRemainingTime(parsed.duration * 60);
      } catch {
        setError("无效的面试设置");
      }
    }
  }, [searchParams]);

  // 滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentTranscript]);

  // 倒计时
  useEffect(() => {
    if (status === "active" && remainingTime > 0) {
      timerRef.current = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            endInterview();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [status]);

  // 格式化时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // 连接 WebSocket
  const connectWebSocket = useCallback(async () => {
    if (!settings) return;

    setStatus("connecting");
    setError(null);

    try {
      // 初始化音频播放器
      playerRef.current = new AudioPlayer();

      // 连接 WebSocket 代理
      const wsUrl = process.env.NEXT_PUBLIC_WS_PROXY_URL || "ws://localhost:8768";
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected");

        // 发送 session.update
        const prompt = generateInterviewPrompt({
          mode: settings.mode,
          position: settings.position,
          company: settings.company,
          round: settings.round as any,
          category: settings.category,
          techStack: (settings as any).techStack,
          resumeContent: settings.resumeContent,
          duration: settings.duration,
        });

        const voice = settings.round
          ? INTERVIEWER_STYLES[settings.round]?.voice || "ash"
          : "ash";

        const sessionUpdate = {
          type: "session.update",
          session: {
            modalities: ["audio", "text"],
            instructions: prompt,
            voice: voice,
            input_audio_format: "pcm16",
            output_audio_format: "pcm16",
            input_audio_transcription: { model: "whisper-1" },
            turn_detection: {
              type: "server_vad",
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 500,
            },
          },
        };

        ws.send(JSON.stringify(sessionUpdate));

        // 触发 AI 开场白
        setTimeout(() => {
          ws.send(JSON.stringify({
            type: "response.create",
            response: {
              modalities: ["audio", "text"],
            },
          }));
        }, 500);

        setStatus("active");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleServerMessage(data);
        } catch (e) {
          console.error("Failed to parse message:", e);
        }
      };

      ws.onerror = (event) => {
        console.error("WebSocket error:", event);
        setError("连接出错，请刷新重试");
        setStatus("idle");
      };

      ws.onclose = () => {
        console.log("WebSocket closed");
        if (status === "active") {
          setStatus("ending");
        }
      };
    } catch (err) {
      console.error("Connection failed:", err);
      setError("连接失败，请检查网络");
      setStatus("idle");
    }
  }, [settings]);

  // 处理服务器消息
  const handleServerMessage = (data: any) => {
    switch (data.type) {
      case "session.created":
      case "session.updated":
        console.log("Session ready");
        break;

      case "response.audio.delta":
        // 播放音频
        if (data.delta && playerRef.current) {
          playerRef.current.play(data.delta);
        }
        break;

      case "response.audio_transcript.delta":
        // 更新 AI 正在说的内容
        setCurrentTranscript((prev) => prev + (data.delta || ""));
        break;

      case "response.audio_transcript.done":
        // AI 说完一句话
        if (data.transcript) {
          const newMessage: Message = {
            id: Date.now().toString(),
            role: "assistant",
            content: data.transcript,
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, newMessage]);
          setCurrentTranscript("");
        }
        break;

      case "conversation.item.input_audio_transcription.completed":
        // 用户说完话
        if (data.transcript) {
          const newMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: data.transcript,
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, newMessage]);
        }
        break;

      case "error":
        console.error("Server error:", data.error);
        if (data.error?.message) {
          setError(data.error.message);
        }
        break;
    }
  };

  // 开始/停止录音
  const toggleRecording = async () => {
    if (isRecording) {
      // 停止录音
      recorderRef.current?.stop();
      recorderRef.current = null;
      setIsRecording(false);

      // 通知服务器用户说完了
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "input_audio_buffer.commit" }));
      }
    } else {
      // 开始录音
      try {
        const recorder = new AudioRecorder();
        recorderRef.current = recorder;

        await recorder.start((audioData) => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            const base64Audio = encodeAudioToBase64(audioData);
            wsRef.current.send(
              JSON.stringify({
                type: "input_audio_buffer.append",
                audio: base64Audio,
              })
            );
          }
        });

        setIsRecording(true);
      } catch (err) {
        console.error("Failed to start recording:", err);
        setError("无法访问麦克风，请检查权限");
      }
    }
  };

  // 结束面试
  const endInterview = useCallback(() => {
    setStatus("ending");

    // 停止录音
    if (recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current = null;
    }
    setIsRecording(false);

    // 停止计时器
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // 关闭 WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // 关闭音频播放器
    if (playerRef.current) {
      playerRef.current.close();
      playerRef.current = null;
    }

    // 跳转到结果页
    const resultData = {
      messages,
      settings,
    };
    const encoded = encodeURIComponent(JSON.stringify(resultData));
    router.push(`/result?data=${encoded}`);
  }, [messages, settings, router]);

  // 获取标题
  const getTitle = () => {
    if (!settings) return "面试进行中";
    const parts = [];
    if (settings.company) parts.push(settings.company);
    if (settings.position) parts.push(settings.position);
    if (settings.round) {
      const roundNames: Record<string, string> = {
        hr: "HR面",
        business: "业务面",
        pressure: "压力面",
        final: "终面",
      };
      parts.push(roundNames[settings.round] || "");
    }
    return parts.join(" · ") || "面试进行中";
  };

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* 顶部栏 */}
      <div className="border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="text-sm text-foreground font-medium">{getTitle()}</div>
        <div className="text-sm text-muted-foreground">{formatTime(remainingTime)}</div>
      </div>

      {/* 对话区域 */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] px-4 py-3 rounded-lg text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {/* 当前正在说的内容 */}
          {currentTranscript && (
            <div className="flex justify-start">
              <div className="max-w-[80%] px-4 py-3 rounded-lg text-sm bg-muted text-foreground">
                {currentTranscript}
                <span className="animate-pulse">▊</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 底部控制区 */}
      <div className="border-t border-border px-4 py-4">
        {error && (
          <div className="text-center text-destructive text-sm mb-4">{error}</div>
        )}

        <div className="max-w-2xl mx-auto">
          {status === "idle" && (
            <Button onClick={connectWebSocket} className="w-full">
              开始面试
            </Button>
          )}

          {status === "connecting" && (
            <div className="text-center text-muted-foreground">连接中...</div>
          )}

          {status === "active" && (
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                onClick={endInterview}
                className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                结束面试
              </Button>

              <button
                onClick={toggleRecording}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                  isRecording
                    ? "bg-destructive text-destructive-foreground scale-110"
                    : "bg-primary text-primary-foreground hover:scale-105"
                }`}
              >
                <div className={`w-6 h-6 ${isRecording ? "rounded-sm" : "rounded-full"} bg-current`} />
              </button>

              <div className="w-[88px]" /> {/* 占位，保持居中 */}
            </div>
          )}

          {status === "active" && (
            <p className="text-center text-muted-foreground text-xs mt-3">
              {isRecording ? "松开停止说话" : "点击开始回答"}
            </p>
          )}

          {status === "ending" && (
            <div className="text-center text-muted-foreground">正在生成面试报告...</div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function InterviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">加载中...</div>}>
      <InterviewContent />
    </Suspense>
  );
}
