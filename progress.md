# AI 面试突击手 - 开发进度

## 项目状态: MVP 开发完成

---

## 已完成功能

### 1. 项目基础架构
- [x] Next.js 15 + TypeScript + Tailwind CSS
- [x] shadcn/ui 组件库集成
- [x] 设计规范实现（#2563eb 蓝色主色调、简约风格）

### 2. 页面开发
- [x] 首页 - 5个面试模式选择卡片
- [x] 设置页 - 支持所有面试模式的参数配置
- [x] 面试房间 - 语音交互界面、倒计时、对话记录
- [x] 结果页 - 评分展示、改进建议

### 3. 核心功能
- [x] WebSocket 代理服务器 (server/proxy.js)
- [x] 音频录制和播放 (24000Hz PCM16)
- [x] 面试报告 AI 生成 (/api/report)
- [x] 动态 Prompt 生成（根据岗位/公司/轮次）

### 4. 面试模式支持
- [x] 互联网面试（产品/前端/后端/数据/运营/市场）
- [x] 公务员面试（综合分析/计划组织/人际关系/应急应变/情景模拟/自我认知）
- [x] 行为面试（领导力/团队合作/解决问题/抗压能力/沟通表达/学习成长）
- [x] 简历模式（上传简历针对性提问）
- [x] 技术八股文（Java/前端/数据库/计算机基础/分布式）

---

## 待完成功能

### 用户系统（下一阶段）
- [ ] 手机号 + 短信验证码登录（阿里云短信）
- [ ] 用户仪表盘
- [ ] 积分系统（15分钟=10积分，30分钟=20积分）
- [ ] 面试历史记录

### 管理后台（下一阶段）
- [ ] 用户管理
- [ ] 对话审计
- [ ] 题库管理
- [ ] Prompt Playground

---

## 启动方式

### 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 同时启动 Next.js 和 WebSocket 代理
npm run dev:all

# 或者分开启动：
# 终端1: npm run dev
# 终端2: npm run proxy
```

### 访问地址
- 前端页面: http://localhost:3000
- WebSocket 代理: ws://localhost:8768
- 代理健康检查: http://localhost:8768/health

---

## 部署说明

### Vercel 部署（前端）

1. 在 Vercel 中导入项目
2. 设置环境变量：
   - `OPENAI_API_KEY`: OpenAI API 密钥
   - `OPENAI_BASE_URL`: https://api.bltcy.ai/v1
   - `NEXT_PUBLIC_WS_PROXY_URL`: WebSocket 代理服务器地址

### WebSocket 代理部署

由于 Vercel 不支持 WebSocket，代理服务器需要单独部署：

**推荐平台：**
- Railway (推荐，简单易用)
- Render
- Fly.io

**Railway 部署步骤：**
1. 新建项目，选择从 GitHub 部署
2. 设置启动命令: `node server/proxy.js`
3. 设置环境变量:
   - `OPENAI_API_KEY`: API 密钥
   - `PORT`: 由平台自动分配
4. 获取部署后的 URL，更新 Vercel 的 `NEXT_PUBLIC_WS_PROXY_URL`

---

## 文件结构

```
ai_interview_trainer/
├── src/
│   ├── app/
│   │   ├── page.tsx              # 首页
│   │   ├── setup/page.tsx        # 设置页
│   │   ├── interview/page.tsx    # 面试房间
│   │   ├── result/page.tsx       # 结果页
│   │   ├── api/report/route.ts   # 报告生成 API
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/ui/            # shadcn/ui 组件
│   ├── lib/
│   │   ├── config.ts             # 岗位/题库配置
│   │   ├── prompts.ts            # Prompt 生成
│   │   ├── audio.ts              # 音频处理
│   │   └── utils.ts
│   └── types/index.ts            # TypeScript 类型
├── server/
│   └── proxy.js                  # WebSocket 代理服务器
├── .env.local                    # 环境变量（本地）
├── package.json
└── progress.md                   # 本文件
```

---

## 环境变量

```env
# OpenAI API 配置
OPENAI_API_KEY=sk-xxx
OPENAI_BASE_URL=https://api.bltcy.ai/v1

# WebSocket 代理
NEXT_PUBLIC_WS_PROXY_URL=ws://localhost:8768
PROXY_PORT=8768
```

---

## 技术配置

| 配置项 | 值 |
|--------|-----|
| Realtime 模型 | gpt-4o-mini-realtime-preview |
| 报告生成模型 | gpt-4o-mini |
| 音频采样率 | 24000 Hz |
| 音频格式 | PCM16 |
| 默认语音 | ash (冷淡干练风格) |

---

## 需要你做的事情

### 1. 配置阿里云短信（用户系统阶段）
- 开通阿里云短信服务
- 申请短信签名和模板
- 获取 AccessKey

### 2. 配置 Supabase（用户系统阶段）
- 创建 Supabase 项目
- 创建数据库表（users, interviews, redeem_codes）
- 获取 API 密钥

### 3. 部署
- 前端部署到 Vercel
- WebSocket 代理部署到 Railway/Render

---

## 下一步开发计划

1. **用户系统**
   - 集成阿里云短信 SDK
   - 实现手机号登录
   - 积分扣费逻辑

2. **数据持久化**
   - 连接 Supabase
   - 保存面试记录
   - 用户积分管理

3. **管理后台**
   - /admin 路由
   - 用户管理界面
   - 题库管理界面
