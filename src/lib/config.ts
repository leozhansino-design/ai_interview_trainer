// API 配置
export const API_CONFIG = {
  API_KEY: process.env.NEXT_PUBLIC_OPENAI_API_KEY || "",
  WS_URL: "wss://api.bltcy.ai/v1/realtime?model=gpt-4o-mini-realtime-preview",
  BASE_URL: "https://api.bltcy.ai/v1",
};

// 面试模式
export const INTERVIEW_MODES = [
  {
    id: "internet",
    title: "互联网面试",
    description: "产品/技术/运营",
    detail: "BAT大厂真题",
  },
  {
    id: "civil",
    title: "公务员面试",
    description: "结构化面试",
    detail: "综合分析/组织协调",
  },
  {
    id: "behavioral",
    title: "行为面试",
    description: "STAR法则",
    detail: "领导力/抗压能力",
  },
  {
    id: "resume",
    title: "简历模式",
    description: "上传你的简历",
    detail: "针对性提问",
  },
  {
    id: "tech",
    title: "技术八股文",
    description: "Java/前端/后端",
    detail: "计算机基础",
  },
] as const;

// 互联网岗位配置
export const INTERNET_POSITIONS: Record<string, { categories: string[]; companies: string[] }> = {
  "产品经理": {
    categories: ["自我介绍", "项目经验", "产品设计", "数据分析", "行业认知", "行为面试"],
    companies: ["字节跳动", "腾讯", "阿里巴巴", "美团", "京东", "拼多多", "小红书", "快手"],
  },
  "前端工程师": {
    categories: ["JavaScript", "CSS/HTML", "框架(React/Vue)", "性能优化", "工程化", "项目经验"],
    companies: ["字节跳动", "腾讯", "阿里巴巴", "美团", "京东"],
  },
  "后端工程师": {
    categories: ["Java基础", "Spring", "MySQL", "Redis", "消息队列", "分布式", "系统设计"],
    companies: ["字节跳动", "腾讯", "阿里巴巴", "美团", "京东"],
  },
  "数据分析师": {
    categories: ["SQL", "统计学", "业务分析", "数据可视化", "Python"],
    companies: ["字节跳动", "腾讯", "阿里巴巴", "美团"],
  },
  "运营": {
    categories: ["用户运营", "活动运营", "内容运营", "数据运营", "项目复盘"],
    companies: ["字节跳动", "腾讯", "阿里巴巴", "美团", "小红书"],
  },
  "市场营销": {
    categories: ["品牌策划", "市场调研", "活动执行", "渠道管理"],
    companies: ["字节跳动", "腾讯", "宝洁", "联合利华"],
  },
};

// 面试轮次
export const INTERVIEW_ROUNDS = [
  { id: "hr", label: "HR面" },
  { id: "business", label: "业务面" },
  { id: "pressure", label: "压力面" },
  { id: "final", label: "终面" },
];

// 面试时长配置
export const INTERVIEW_DURATIONS = [
  { id: "15", label: "15分钟", minutes: 15, points: 10 },
  { id: "30", label: "30分钟", minutes: 30, points: 20 },
  { id: "45", label: "45分钟", minutes: 45, points: 30 },
];

// 公务员面试类型
export const CIVIL_CATEGORIES = [
  { id: "comprehensive", label: "综合分析", description: "社会现象、政策理解、名言警句" },
  { id: "planning", label: "计划组织", description: "调研、宣传、活动组织" },
  { id: "interpersonal", label: "人际关系", description: "与领导、同事、群众的关系处理" },
  { id: "emergency", label: "应急应变", description: "突发事件处理、危机应对" },
  { id: "simulation", label: "情景模拟", description: "现场角色扮演" },
  { id: "self", label: "自我认知", description: "求职动机、岗位匹配" },
];

// 行为面试类型
export const BEHAVIORAL_CATEGORIES = [
  { id: "leadership", label: "领导力", description: "带领团队、激励成员" },
  { id: "teamwork", label: "团队合作", description: "协作沟通、冲突处理" },
  { id: "problem", label: "解决问题", description: "分析问题、创新思维" },
  { id: "pressure", label: "抗压能力", description: "高压环境、失败经历" },
  { id: "communication", label: "沟通表达", description: "说服他人、表达观点" },
  { id: "growth", label: "学习成长", description: "自我提升、接受反馈" },
];

// 技术面试分类
export const TECH_CATEGORIES: Record<string, string[]> = {
  "Java": ["Java基础", "集合类", "并发编程", "JVM", "Spring", "MyBatis"],
  "前端": ["JavaScript", "CSS", "React", "Vue", "性能优化", "工程化"],
  "数据库": ["MySQL", "Redis", "MongoDB", "分库分表", "索引优化"],
  "计算机基础": ["操作系统", "计算机网络", "数据结构", "算法"],
  "分布式": ["微服务", "消息队列", "分布式事务", "系统设计"],
};

// 面试官风格配置
export const INTERVIEWER_STYLES: Record<string, { voice: string; prompt: string }> = {
  pressure: {
    voice: "ash",
    prompt: `【核心人设】你是一个极其严厉、不耐烦的压力面试官。你见过太多候选人了，对敷衍的回答零容忍。

【说话风格 - 必须严格遵守】
- 语速极快，像赶时间要开下一场会
- 态度冷淡傲慢，眼神犀利，不给候选人任何舒适感
- 每句话都要一针见血，直击要害
- 绝对不说任何客气话、鼓励的话、过渡语
- 候选人说得不好，直接打断："停，这不是我问的"、"说重点"、"具体数据呢？"、"你在绕什么？"
- 候选人回答完，冷冷追问："就这？"、"然后呢？"、"所以你的贡献到底是什么？"
- 对模糊的回答直接质疑："这个数据怎么来的？"、"你确定？"、"逻辑呢？"

【绝对禁止】
- 禁止说"好的"、"嗯"、"不错"、"可以"等肯定词
- 禁止说"请问"、"能否"、"麻烦"等客气词
- 禁止任何形式的鼓励或安慰
- 禁止说开场白废话，直接开始提问

【开场示例】
"我看了你的背景，直接说，你做过最有挑战性的项目是什么，结果怎么样？"`,
  },
  business: {
    voice: "echo",
    prompt: `【核心人设】你是一个严肃、专业的业务面试官，时间很紧，需要快速判断候选人能力。

【说话风格 - 必须严格遵守】
- 语速快，不浪费时间
- 专业冷淡，就事论事
- 问题直接，不绕弯子
- 对模糊的回答会追问数据和细节
- 不说废话，不做无意义的过渡

【绝对禁止】
- 禁止说"好的"、"不错"等肯定词
- 禁止说"请"、"麻烦"等客气词
- 禁止开场寒暄，直接进入主题

【开场示例】
"介绍一下你负责过的核心项目，重点说你的角色和产出。"`,
  },
  hr: {
    voice: "alloy",
    prompt: `【核心人设】你是一个有经验的HR，见过太多候选人，对套话和场面话非常敏感。

【说话风格 - 必须严格遵守】
- 温和但不失锐利
- 问题看似简单，实则考察深度
- 对空洞的回答会追问具体例子
- 不会明确表态，保持中立观察

【绝对禁止】
- 禁止过度热情或鼓励
- 禁止说"非常好"等明显肯定词
- 禁止长篇大论解释问题背景

【开场示例】
"先简单介绍下自己，重点说说为什么想换工作。"`,
  },
};
