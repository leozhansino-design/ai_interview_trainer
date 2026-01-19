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
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const autoRecordingRef = useRef<boolean>(false);

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

  // 自动开始录音
  const startAutoRecording = useCallback(async () => {
    if (autoRecordingRef.current || !wsRef.current) return;

    try {
      autoRecordingRef.current = true;
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
      console.error("Failed to start auto recording:", err);
      autoRecordingRef.current = false;
    }
  }, []);

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

        // 发送 session.update - 使用 Server VAD 自动检测语音
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
              silence_duration_ms: 800, // 用户停顿 800ms 后认为说完
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

        // 立即开始录音，让 Server VAD 处理
        setTimeout(() => {
          startAutoRecording();
        }, 1000);
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
  }, [settings, startAutoRecording]);

  // 处理服务器消息
  const handleServerMessage = (data: any) => {
    switch (data.type) {
      case "session.created":
      case "session.updated":
        console.log("Session ready");
        break;

      case "response.audio.delta":
        // AI 正在说话
        setIsAISpeaking(true);
        if (data.delta && playerRef.current) {
          playerRef.current.play(data.delta);
        }
        break;

      case "response.audio_transcript.delta":
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

      case "response.done":
        // AI 完全说完，可以开始录音
        setIsAISpeaking(false);
        break;

      case "input_audio_buffer.speech_started":
        // 用户开始说话（VAD 检测到）
        setIsRecording(true);
        break;

      case "input_audio_buffer.speech_stopped":
        // 用户停止说话（VAD 检测到）
        setIsRecording(false);
        break;

      case "conversation.item.input_audio_transcription.completed":
        // 用户说完话，转录完成
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

  // 结束面试
  const endInterview = useCallback(() => {
    setStatus("ending");

    // 停止录音
    if (recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current = null;
    }
    autoRecordingRef.current = false;
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

    const modeNames: Record<string, string> = {
      civil: "公务员面试",
      behavioral: "行为面试",
      internet: "互联网面试",
      resume: "简历面试",
      tech: "技术面试",
    };

    const parts = [];
    if (settings.company) parts.push(settings.company);
    if (settings.position) parts.push(settings.position);
    if (settings.mode && !settings.company && !settings.position) {
      parts.push(modeNames[settings.mode] || "模拟面试");
    }

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col bg-background">
      {/* 顶部栏 */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-md px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <div className="text-sm text-foreground font-medium">{getTitle()}</div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-2xl font-mono text-primary font-bold">
            {formatTime(remainingTime)}
          </div>
        </div>
      </div>

      {/* 对话区域 */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.length === 0 && status === "active" && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-primary rounded-full wave-bar"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
              </div>
              <p className="text-muted-foreground">面试官正在准备问题...</p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-card border border-border rounded-bl-md"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {/* AI 正在说的内容 */}
          {currentTranscript && (
            <div className="flex justify-start">
              <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-bl-md text-sm bg-card border border-border">
                {currentTranscript}
                <span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 底部控制区 */}
      <div className="border-t border-border/50 bg-card/50 backdrop-blur-md px-4 py-6">
        {error && (
          <div className="max-w-2xl mx-auto mb-4">
            <div className="text-center text-destructive text-sm bg-destructive/10 rounded-lg py-2 px-4">
              {error}
            </div>
          </div>
        )}

        <div className="max-w-2xl mx-auto">
          {status === "idle" && (
            <Button
              onClick={connectWebSocket}
              className="w-full btn-gradient py-6 text-lg rounded-xl"
            >
              开始面试
            </Button>
          )}

          {status === "connecting" && (
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">正在连接面试官...</p>
            </div>
          )}

          {status === "active" && (
            <div className="flex flex-col items-center gap-6">
              {/* 语音状态指示器 */}
              <div className="flex items-center gap-4">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                  isAISpeaking
                    ? "bg-primary/20 text-primary"
                    : isRecording
                    ? "bg-green-500/20 text-green-500"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {isAISpeaking ? (
                    <>
                      <div className="flex gap-0.5">
                        {[...Array(4)].map((_, i) => (
                          <div
                            key={i}
                            className="w-1 bg-primary rounded-full wave-bar"
                            style={{ animationDelay: `${i * 0.1}s` }}
                          />
                        ))}
                      </div>
                      <span className="text-sm">面试官正在说话</span>
                    </>
                  ) : isRecording ? (
                    <>
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-sm">正在录音中...</span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                      <span className="text-sm">等待发言</span>
                    </>
                  )}
                </div>
              </div>

              {/* 结束按钮 */}
              <Button
                variant="outline"
                onClick={endInterview}
                className="px-8 py-3 text-destructive border-destructive/50 hover:bg-destructive hover:text-destructive-foreground rounded-xl"
              >
                结束面试
              </Button>

              <p className="text-muted-foreground text-xs text-center">
                直接开始说话即可，AI 会自动检测你的发言
              </p>
            </div>
          )}

          {status === "ending" && (
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">正在生成面试报告...</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function InterviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    }>
      <InterviewContent />
    </Suspense>
  );
}
