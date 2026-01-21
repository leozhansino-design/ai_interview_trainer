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
  const [pendingUserMessageId, setPendingUserMessageId] = useState<string | null>(null);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const fullTextRef = useRef("");

  const wsRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const remainingTimeRef = useRef<number>(0); // 用于在回调中访问剩余时间
  const startRecordingRef = useRef<() => void>(() => {}); // 用于在消息处理中调用

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

  // 同步 remainingTime 到 ref
  useEffect(() => {
    remainingTimeRef.current = remainingTime;
  }, [remainingTime]);

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

  // 手动开始录音
  const startRecording = useCallback(async () => {
    if (isRecording || !wsRef.current || isAISpeaking) {
      console.log("[录音] 无法开始录音:", { isRecording, isAISpeaking, hasWs: !!wsRef.current });
      return;
    }

    console.log("[录音] 开始录音...");

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
          // 不要每帧都打印，太多了
        }
      });

      setIsRecording(true);
      console.log("[录音] 录音已开始");
    } catch (err) {
      console.error("[录音] 启动失败:", err);
      setError("无法启动麦克风，请检查权限");
    }
  }, [isRecording, isAISpeaking]);

  // 同步 startRecording 到 ref，以便在消息处理中调用
  useEffect(() => {
    startRecordingRef.current = startRecording;
  }, [startRecording]);

  // 手动停止录音并提交
  const stopRecording = useCallback(() => {
    if (!isRecording || !wsRef.current) return;

    console.log("[录音] 停止录音并提交");

    // 停止录音
    if (recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current = null;
    }
    setIsRecording(false);

    // 立即添加用户消息占位符，确保消息顺序正确
    const messageId = Date.now().toString();
    const placeholderMessage: Message = {
      id: messageId,
      role: "user",
      content: "...",
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, placeholderMessage]);
    setPendingUserMessageId(messageId);

    // 提交音频缓冲区
    const commitMsg = { type: "input_audio_buffer.commit" };
    console.log("[发送]", commitMsg);
    wsRef.current.send(JSON.stringify(commitMsg));

    // 计算剩余时间信息
    const mins = Math.floor(remainingTimeRef.current / 60);
    const secs = remainingTimeRef.current % 60;
    const timeInfo = `[系统提示：面试剩余时间 ${mins}分${secs}秒，请根据时间调整问题深度和数量]`;

    // 触发 AI 回复，附带时间信息
    const responseMsg = {
      type: "response.create",
      response: {
        modalities: ["audio", "text"],
        instructions: timeInfo, // 告诉AI当前剩余时间
      },
    };
    console.log("[发送]", responseMsg);
    wsRef.current.send(JSON.stringify(responseMsg));
  }, [isRecording]);

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
        console.log("[WebSocket] 已连接");

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
            turn_detection: null, // 手动模式，不使用自动语音检测
          },
        };

        console.log("[发送] session.update", { voice, promptLength: prompt.length });
        console.log("[System Prompt]", prompt);
        ws.send(JSON.stringify(sessionUpdate));

        // 触发 AI 开场白
        setTimeout(() => {
          const responseCreate = {
            type: "response.create",
            response: {
              modalities: ["audio", "text"],
            },
          };
          console.log("[发送]", responseCreate);
          ws.send(JSON.stringify(responseCreate));
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
    // 详细日志 - 除了音频数据外都打印
    if (data.type !== "response.audio.delta" && data.type !== "input_audio_buffer.speech_started" && data.type !== "input_audio_buffer.speech_stopped") {
      console.log("[收到]", data.type, data);
    }

    switch (data.type) {
      case "session.created":
        console.log("[会话] 已创建", data.session?.id);
        break;

      case "session.updated":
        console.log("[会话] 已更新");
        break;

      case "response.audio.delta":
        // AI 正在说话 - 不打印每帧
        setIsAISpeaking(true);
        if (data.delta && playerRef.current) {
          playerRef.current.play(data.delta);
        }
        break;

      case "response.audio_transcript.delta":
        // 缓存文本，不直接显示
        fullTextRef.current += (data.delta || "");
        break;

      case "response.audio_transcript.done":
        // AI 说完一句话，开始流畅打字效果
        console.log("[AI说完]", data.transcript);
        if (data.transcript) {
          setIsTyping(true);
          setDisplayedText("");
          setCurrentTranscript("");
          const text = data.transcript;
          let index = 0;

          const typeInterval = setInterval(() => {
            if (index < text.length) {
              const charsToAdd = Math.min(3, text.length - index);
              setDisplayedText(text.slice(0, index + charsToAdd));
              index += charsToAdd;
            } else {
              clearInterval(typeInterval);
              setIsTyping(false);
              const newMessage: Message = {
                id: Date.now().toString(),
                role: "assistant",
                content: text,
                timestamp: Date.now(),
              };
              setMessages((prev) => [...prev, newMessage]);
              setDisplayedText("");
            }
          }, 30);

          fullTextRef.current = "";
        }
        break;

      case "response.done":
        // AI 完全说完，自动开始录音
        console.log("[AI回复完成] 自动开始录音...");
        setIsAISpeaking(false);
        // 延迟一点开始录音，确保状态已更新
        setTimeout(() => {
          startRecordingRef.current();
        }, 300);
        break;

      case "conversation.item.input_audio_transcription.completed":
        // 用户语音转录完成，更新占位消息
        console.log("[用户说完]", data.transcript);
        if (data.transcript) {
          setMessages((prev) => {
            const updated = prev.map((msg) => {
              if (msg.id === pendingUserMessageId || (msg.role === "user" && msg.content === "...")) {
                return { ...msg, content: data.transcript };
              }
              return msg;
            });
            return updated;
          });
          setPendingUserMessageId(null);
        }
        break;

      case "rate_limits.updated":
        console.log("[费率限制]", data.rate_limits);
        break;

      case "response.created":
        console.log("[AI开始生成回复]");
        break;

      case "response.output_item.added":
        console.log("[AI输出项添加]");
        break;

      case "conversation.item.created":
        console.log("[对话项创建]", data.item?.type);
        break;

      case "error":
        console.error("[错误]", data.error);
        if (data.error?.message) {
          setError(data.error.message);
        }
        break;

      default:
        // 其他未处理的消息类型也打印出来
        console.log("[其他消息]", data.type);
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
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} items-start gap-3`}
            >
              {/* AI头像 */}
              {msg.role === "assistant" && (
                <div className="flex-shrink-0 relative">
                  <div className="absolute inset-0 w-10 h-10 rounded-full bg-blue-500/20 scale-150" />
                  <div className="absolute inset-0 w-10 h-10 rounded-full bg-blue-500/10 scale-[1.8]" />
                  <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg">
                    <div className="flex items-center justify-center gap-[2px]">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className="w-[2px] bg-white rounded-full"
                          style={{
                            height: i === 2 ? '14px' : i === 1 || i === 3 ? '10px' : '6px',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div
                className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-card border border-border rounded-bl-md"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {/* AI 正在说话或打字中 */}
          {(isAISpeaking || isTyping) && (
            <div className="flex justify-start items-start gap-3">
              {/* AI头像带声波动画 */}
              <div className="flex-shrink-0 relative">
                <div className={`absolute inset-0 w-10 h-10 rounded-full bg-blue-500/20 scale-150 ${isAISpeaking ? 'animate-pulse' : ''}`} />
                <div className={`absolute inset-0 w-10 h-10 rounded-full bg-blue-500/10 scale-[1.8] ${isAISpeaking ? 'animate-pulse' : ''}`} />
                <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <div className="flex items-center justify-center gap-[2px]">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="w-[2px] bg-white rounded-full transition-all duration-150"
                        style={{
                          height: isAISpeaking
                            ? `${6 + Math.random() * 10}px`
                            : i === 2 ? '14px' : i === 1 || i === 3 ? '10px' : '6px',
                          animation: isAISpeaking ? `soundwave 0.4s ease-in-out infinite` : 'none',
                          animationDelay: `${i * 0.08}s`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="max-w-[75%] px-4 py-3 rounded-2xl rounded-bl-md text-sm bg-card border border-border">
                {isTyping && displayedText ? (
                  <>
                    {displayedText}
                    <span className="animate-pulse ml-0.5">|</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">正在思考...</span>
                )}
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
              {/* 状态提示 */}
              {isAISpeaking && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary">
                  <div className="flex gap-0.5">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-primary rounded-full wave-bar"
                        style={{ animationDelay: `${i * 0.1}s` }}
                      />
                    ))}
                  </div>
                  <span className="text-sm">面试官正在说话...</span>
                </div>
              )}

              {/* 录音控制按钮 */}
              <div className="flex items-center gap-4">
                {!isRecording ? (
                  <Button
                    onClick={startRecording}
                    disabled={isAISpeaking}
                    className="px-8 py-6 text-lg rounded-xl btn-gradient disabled:opacity-50"
                  >
                    {isAISpeaking ? "⏳ 等待面试官说完..." : "🎤 点击开始回答"}
                  </Button>
                ) : (
                  <Button
                    onClick={stopRecording}
                    className="px-8 py-6 text-lg rounded-xl bg-green-600 hover:bg-green-700 text-white animate-pulse"
                  >
                    ✅ 回答完毕
                  </Button>
                )}
              </div>

              {isRecording && (
                <div className="flex items-center gap-2 text-green-500">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm">正在录音... 说完请点击"回答完毕"</span>
                </div>
              )}

              {!isRecording && !isAISpeaking && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-sm">AI说完后会自动开始录音，你也可以手动点击开始</span>
                </div>
              )}

              {/* 结束面试按钮 */}
              <Button
                variant="outline"
                onClick={endInterview}
                className="px-6 py-2 text-destructive border-destructive/50 hover:bg-destructive hover:text-destructive-foreground rounded-xl"
              >
                结束面试
              </Button>
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
