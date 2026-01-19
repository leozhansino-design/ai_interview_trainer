# AI 面试突击手 - 技术总结报告

## 目录

1. [项目概述](#项目概述)
2. [系统架构](#系统架构)
3. [核心模块详解](#核心模块详解)
4. [Prompt 设计原理](#prompt-设计原理)
5. [运行流程](#运行流程)
6. [技术选型](#技术选型)

---

## 项目概述

AI 面试突击手是一个基于 OpenAI Realtime API 的实时语音面试模拟系统。与传统的题库背诵不同，用户可以与 AI 面试官进行实时语音对话，AI 会根据用户的回答进行追问，模拟真实面试场景。

**核心特点：**
- 实时语音交互（非文字输入）
- Server VAD 自动语音检测
- 多种面试模式（公务员、行为、互联网等）
- AI 智能追问和评估

---

## 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                       用户浏览器                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   首页      │  │   设置页    │  │    面试房间          │  │
│  │  page.tsx   │  │  setup/     │  │   interview/        │  │
│  │             │  │  page.tsx   │  │   page.tsx          │  │
│  └─────────────┘  └─────────────┘  └────────┬────────────┘  │
│                                              │               │
│                                     WebSocket 连接            │
└──────────────────────────────────────────────┼──────────────┘
                                               │
                                               ▼
┌──────────────────────────────────────────────────────────────┐
│                    WebSocket 代理服务器                        │
│                     (server/proxy.js)                        │
│                     运行在 Railway                            │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  - 接收浏览器 WebSocket 连接                             │  │
│  │  - 添加 OpenAI API 认证头                                │  │
│  │  - 转发消息到 OpenAI Realtime API                        │  │
│  │  - 消息队列处理                                          │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                                               │
                                               ▼
┌──────────────────────────────────────────────────────────────┐
│                   OpenAI Realtime API                        │
│              wss://api.bltcy.ai/v1/realtime                  │
│                 gpt-4o-mini-realtime-preview                 │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  - 接收音频数据 (PCM16 24kHz)                            │  │
│  │  - 语音转文字 (ASR)                                      │  │
│  │  - GPT 生成回复                                          │  │
│  │  - 文字转语音 (TTS)                                      │  │
│  │  - Server VAD 语音活动检测                               │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### 为什么需要代理服务器？

1. **浏览器限制**：浏览器不能直接在 WebSocket 请求中设置 Authorization 头
2. **API Key 安全**：API Key 不应暴露在前端代码中
3. **Vercel 限制**：Vercel 不支持 WebSocket 长连接
4. **消息缓冲**：代理可以在 OpenAI 连接建立前缓存消息

---

## 核心模块详解

### 1. WebSocket 代理服务器 (`server/proxy.js`)

```javascript
// 核心流程
1. 客户端连接代理服务器
2. 代理服务器创建到 OpenAI 的连接
3. 双向转发消息
4. 添加认证头：Authorization: Bearer <API_KEY>
```

**关键配置：**
```javascript
const OPENAI_WS_URL = "wss://api.bltcy.ai/v1/realtime?model=gpt-4o-mini-realtime-preview";

// 消息队列机制 - 在 OpenAI 连接建立前缓存消息
const messageQueue = [];
if (isOpenAIConnected) {
  openaiWs.send(message);
} else {
  messageQueue.push(message);
}
```

### 2. 音频处理模块 (`src/lib/audio.ts`)

**AudioRecorder 类：**
```typescript
// 录音配置
- 采样率：48000 Hz（系统）→ 24000 Hz（重采样）
- 格式：PCM16（16位有符号整数）
- 通道：单声道

// 工作流程
1. navigator.mediaDevices.getUserMedia() 获取麦克风权限
2. AudioContext 处理音频流
3. ScriptProcessorNode 捕获音频数据
4. 重采样到 24000 Hz
5. 转换为 PCM16 格式
6. Base64 编码后发送
```

**AudioPlayer 类：**
```typescript
// 播放配置
- 采样率：24000 Hz
- 格式：PCM16
- 播放方式：Web Audio API

// 工作流程
1. 接收 Base64 编码的音频数据
2. 解码为 ArrayBuffer
3. 转换为 Float32 数组
4. 创建 AudioBufferSourceNode 播放
```

### 3. 面试配置 (`src/lib/config.ts`)

**面试模式配置：**
```typescript
// 5 种面试模式
INTERVIEW_MODES = ["internet", "civil", "behavioral", "resume", "tech"]

// 公务员面试分类
CIVIL_CATEGORIES = [
  { id: "comprehensive", label: "综合分析", description: "社会现象、政策理解" },
  { id: "planning", label: "计划组织", description: "调研、宣传、活动组织" },
  // ...
]

// 行为面试分类
BEHAVIORAL_CATEGORIES = [
  { id: "leadership", label: "领导力", description: "带领团队、激励成员" },
  { id: "teamwork", label: "团队合作", description: "协作沟通、冲突处理" },
  // ...
]

// 面试官风格
INTERVIEWER_STYLES = {
  pressure: { voice: "ash", prompt: "语速快、态度冷淡、经常打断" },
  business: { voice: "echo", prompt: "专业严肃、深挖细节" },
  hr: { voice: "alloy", prompt: "温和专业、关注软素质" }
}
```

### 4. Prompt 生成 (`src/lib/prompts.ts`)

**动态 Prompt 生成逻辑：**
```typescript
function generateInterviewPrompt(params: PromptParams): string {
  // 1. 根据模式选择基础 Prompt
  switch (mode) {
    case "internet": return generateInternetPrompt();
    case "civil": return generateCivilPrompt();
    case "behavioral": return generateBehavioralPrompt();
    // ...
  }

  // 2. 添加面试官风格
  const style = INTERVIEWER_STYLES[round];

  // 3. 添加通用规则
  return `${basePrompt}
    ${style.prompt}
    【时间限制】本次面试时长为${duration}分钟
    【重要规则】
    1. 只能用中文交流
    2. 每次只问一个问题
    3. 根据回答深度决定是否追问
    ...
  `;
}
```

### 5. 面试房间 (`src/app/interview/page.tsx`)

**核心状态管理：**
```typescript
const [status, setStatus] = useState<"idle" | "connecting" | "active" | "ending">("idle");
const [messages, setMessages] = useState<Message[]>([]);
const [isRecording, setIsRecording] = useState(false);
const [remainingTime, setRemainingTime] = useState(duration * 60);
```

**Server VAD 配置：**
```typescript
// session.update 消息中配置
turn_detection: {
  type: "server_vad",        // 使用服务端语音活动检测
  threshold: 0.5,            // 灵敏度阈值
  prefix_padding_ms: 300,    // 语音开始前保留的毫秒数
  silence_duration_ms: 800,  // 静默多久判定为说完
}
```

**自动录音机制：**
```typescript
// 当收到 session.created 事件时，自动开始录音
case "session.created":
  sendSessionUpdate();    // 发送配置
  startRecording();       // 立即开始录音
  break;

// Server VAD 会自动检测用户是否在说话
// 用户说完后（800ms 静默），自动触发 AI 回复
```

---

## Prompt 设计原理

### 面试官角色设定

**公务员面试 Prompt：**
```
你是公务员面试的考官，正在进行结构化面试的${categoryName}题考察。

【题目类型】${categoryDesc}

【评分标准】
1. 观点是否正确、全面
2. 逻辑是否清晰、有条理
3. 语言表达是否流畅
4. 是否有创新思维
```

**行为面试 Prompt：**
```
你是行为面试官，正在考察候选人的${categoryName}能力。

【考察维度】${categoryDesc}

【面试方法】使用STAR法则追问：
- Situation：具体是什么情况？
- Task：你的任务/目标是什么？
- Action：你采取了什么行动？
- Result：最终结果如何？有什么数据？
```

**压力面试风格：**
```
【重要】你的说话风格：
- 语速非常快，像赶时间一样
- 态度冷淡、不耐烦、有点傲慢
- 经常打断："行了行了，说重点"、"然后呢？"、"就这？"
- 不说任何客气话
- 会故意刁难和质疑
```

### 通用规则

所有面试 Prompt 都包含以下规则：
```
【重要规则】
1. 你只能用中文交流
2. 每次只问一个问题，等候选人回答后再追问
3. 根据回答深度决定是否追问，最多追问2次
4. 如果回答明显跑题或敷衍，直接指出并换下一题
5. 开场先用一句话介绍自己的角色，然后直接开始提问
```

---

## 运行流程

### 完整面试流程

```
┌────────────────────────────────────────────────────────────────┐
│                        用户操作流程                              │
└────────────────────────────────────────────────────────────────┘

1. 首页选择面试模式
   │
   ▼
2. 设置页配置参数
   │ - 选择分类（如：综合分析、领导力）
   │ - 选择时长（15/30/45分钟）
   │ - [互联网模式] 选择岗位和公司
   │
   ▼
3. 进入面试房间
   │
   ├──► 建立 WebSocket 连接
   │    │
   │    ▼
   ├──► 发送 session.update 配置
   │    │ - 设置 Prompt
   │    │ - 配置 Server VAD
   │    │ - 设置语音
   │    │
   │    ▼
   ├──► 自动开始录音
   │    │
   │    ▼
   ├──► AI 面试官开场提问
   │    │
   │    ▼
   └──► 循环对话
        │
        ├─► 用户语音回答
        │   │
        │   ▼
        ├─► Server VAD 检测到用户说完
        │   │
        │   ▼
        ├─► AI 分析回答并追问/提新问题
        │   │
        │   ▼
        └─► 重复直到时间结束或用户主动结束
            │
            ▼
4. 结果页
   │ - 发送对话记录到 /api/report
   │ - AI 生成评估报告
   │ - 显示维度评分和改进建议
   │
   ▼
5. 可选择再来一次或换个模式
```

### WebSocket 消息流

```
浏览器                    代理服务器                 OpenAI API
   │                         │                         │
   │◄── WebSocket 连接 ──────│                         │
   │                         │                         │
   │                         │──── WebSocket 连接 ────►│
   │                         │                         │
   │─── session.update ─────►│─── session.update ─────►│
   │                         │                         │
   │◄── session.created ─────│◄── session.created ─────│
   │                         │                         │
   │─ input_audio_buffer ───►│─ input_audio_buffer ───►│
   │      .append            │      .append            │
   │                         │                         │
   │                         │◄─ response.audio ───────│
   │◄─ response.audio ───────│      .delta             │
   │      .delta             │                         │
   │                         │                         │
   │◄─ response.audio ───────│◄─ response.audio ───────│
   │   _transcript.done      │   _transcript.done      │
   │                         │                         │
```

### 关键消息类型

**发送到 OpenAI 的消息：**
```javascript
// 1. 会话配置
{
  type: "session.update",
  session: {
    instructions: "面试官 Prompt",
    voice: "ash",
    input_audio_format: "pcm16",
    output_audio_format: "pcm16",
    turn_detection: {
      type: "server_vad",
      threshold: 0.5,
      silence_duration_ms: 800
    }
  }
}

// 2. 音频数据
{
  type: "input_audio_buffer.append",
  audio: "base64编码的PCM16音频数据"
}

// 3. 手动触发响应
{
  type: "response.create",
  response: { modalities: ["text", "audio"] }
}
```

**从 OpenAI 接收的消息：**
```javascript
// 1. 会话创建
{ type: "session.created" }

// 2. 语音回复（流式）
{
  type: "response.audio.delta",
  delta: "base64编码的音频片段"
}

// 3. 文字转录
{
  type: "response.audio_transcript.done",
  transcript: "AI说的话的文字版本"
}

// 4. 用户语音转录
{
  type: "conversation.item.input_audio_transcription.completed",
  transcript: "用户说的话的文字版本"
}
```

---

## 技术选型

| 技术 | 选择 | 原因 |
|------|------|------|
| 前端框架 | Next.js 16 | App Router、Server Components、优秀的 SSR 支持 |
| UI 库 | shadcn/ui | 可定制性强、Tailwind CSS 原生集成 |
| 样式 | Tailwind CSS 4 | 原子化 CSS、开发效率高 |
| AI API | OpenAI Realtime | 唯一支持实时语音交互的 API |
| WebSocket | ws | Node.js 标准 WebSocket 库 |
| 测试 | Jest + Testing Library | React 生态主流测试方案 |
| 部署 | Vercel + Railway | Vercel 前端部署、Railway 支持 WebSocket |

### 音频格式选择

**为什么使用 PCM16 24kHz？**
1. OpenAI Realtime API 原生支持格式
2. 无压缩、延迟低
3. 足够的音质用于语音识别

**为什么需要重采样？**
- 浏览器麦克风默认采样率通常是 48000 Hz
- OpenAI 要求 24000 Hz
- 在前端进行重采样可以减少传输数据量

---

## 总结

AI 面试突击手通过以下技术实现了实时语音面试模拟：

1. **WebSocket 代理** - 解决浏览器无法直接访问 OpenAI API 的问题
2. **Server VAD** - 自动检测用户语音，无需手动操作
3. **动态 Prompt** - 根据面试类型生成针对性的面试官人设
4. **音频处理** - PCM16 格式确保低延迟的语音交互

这种架构使得用户可以像真实面试一样与 AI 进行流畅的语音对话，获得接近真实面试的练习体验。
