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
    prompt: `【重要】你的说话风格：
- 语速非常快，像赶时间一样
- 态度冷淡、不耐烦、有点傲慢
- 经常打断："行了行了，说重点"、"然后呢？"、"就这？"
- 不说任何客气话
- 会故意刁难和质疑`,
  },
  business: {
    voice: "echo",
    prompt: `【说话风格】
- 专业严肃，就事论事
- 深挖细节，追问数据
- 偶尔质疑，但相对客观
- 不会太客气，但也不刁难`,
  },
  hr: {
    voice: "alloy",
    prompt: `【说话风格】
- 相对温和但不失专业
- 关注软素质和动机
- 会观察情绪和态度
- 适当给予鼓励`,
  },
};
