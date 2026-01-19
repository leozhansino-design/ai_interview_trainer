import {
  INTERVIEWER_STYLES,
  CIVIL_CATEGORIES,
  BEHAVIORAL_CATEGORIES,
} from "./config";
import type { InterviewMode, InterviewRound } from "@/types";

interface PromptParams {
  mode: InterviewMode;
  position?: string;
  company?: string;
  round?: InterviewRound;
  category?: string;
  techStack?: string;
  resumeContent?: string;
  duration: number;
}

export function generateInterviewPrompt(params: PromptParams): string {
  const { mode, position, company, round, category, techStack, resumeContent, duration } = params;

  // 获取面试官风格
  const style = round ? INTERVIEWER_STYLES[round] || INTERVIEWER_STYLES.business : INTERVIEWER_STYLES.business;

  let basePrompt = "";

  switch (mode) {
    case "internet":
      basePrompt = generateInternetPrompt(position!, company!, round!);
      break;
    case "civil":
      basePrompt = generateCivilPrompt(category!);
      break;
    case "behavioral":
      basePrompt = generateBehavioralPrompt(category!);
      break;
    case "resume":
      basePrompt = generateResumePrompt(resumeContent!, position);
      break;
    case "tech":
      basePrompt = generateTechPrompt(techStack!, category!);
      break;
  }

  return `${basePrompt}

${style.prompt}

【时间限制】
本次面试时长为${duration}分钟，请合理控制节奏。

【重要规则】
1. 你只能用中文交流
2. 每次只问一个问题，等候选人回答后再追问
3. 根据回答深度决定是否追问，最多追问2次
4. 如果回答明显跑题或敷衍，直接指出并换下一题
5. 开场先用一句话介绍自己的角色，然后直接开始提问`;
}

function generateInternetPrompt(position: string, company: string, round: InterviewRound): string {
  const roundNames: Record<InterviewRound, string> = {
    hr: "HR面试",
    business: "业务面试",
    pressure: "压力面试",
    final: "终面",
  };

  return `你是${company}的${position}面试官，正在进行${roundNames[round]}。

【面试重点】
- 业务面：深挖项目经历、专业能力、数据思维
- HR面：考察价值观、职业规划、团队协作
- 压力面：高强度追问、质疑数据、挑战逻辑
- 终面：综合评估、战略思维、文化匹配`;
}

function generateCivilPrompt(categoryId: string): string {
  const category = CIVIL_CATEGORIES.find((c) => c.id === categoryId);
  const categoryName = category?.label || "综合分析";
  const categoryDesc = category?.description || "";

  return `你是公务员面试的考官，正在进行结构化面试的${categoryName}题考察。

【题目类型】${categoryDesc}

【评分标准】
1. 观点是否正确、全面
2. 逻辑是否清晰、有条理
3. 语言表达是否流畅
4. 是否有创新思维`;
}

function generateBehavioralPrompt(categoryId: string): string {
  const category = BEHAVIORAL_CATEGORIES.find((c) => c.id === categoryId);
  const categoryName = category?.label || "领导力";
  const categoryDesc = category?.description || "";

  return `你是行为面试官，正在考察候选人的${categoryName}能力。

【考察维度】${categoryDesc}

【面试方法】使用STAR法则追问：
- Situation：具体是什么情况？
- Task：你的任务/目标是什么？
- Action：你采取了什么行动？
- Result：最终结果如何？有什么数据？`;
}

function generateResumePrompt(resumeContent: string, position?: string): string {
  const positionText = position ? `，目标岗位是${position}` : "";

  return `你是面试官${positionText}。

【候选人简历】
${resumeContent.slice(0, 2000)}

【面试策略】
1. 针对简历中的项目经历深挖细节
2. 追问数据指标的来源和真实性
3. 区分个人贡献和团队贡献
4. 找出简历中的疑点进行追问`;
}

function generateTechPrompt(techStack: string, category: string): string {
  return `你是技术面试官，正在考察${techStack}方向的${category}知识。

【面试策略】
1. 从基础概念问起，逐步深入
2. 结合实际场景考察理解深度
3. 追问底层原理和实现细节
4. 考察举一反三的能力`;
}

// 生成面试报告的 Prompt
export function generateReportPrompt(transcript: string): string {
  return `请根据以下面试对话记录，生成一份专业的面试评估报告。

【对话记录】
${transcript}

【输出格式】
请严格按照以下JSON格式输出：
{
  "totalScore": 75,
  "dimensions": [
    {"name": "表达清晰度", "score": 80},
    {"name": "逻辑结构", "score": 70},
    {"name": "专业深度", "score": 75},
    {"name": "应变能力", "score": 72}
  ],
  "suggestions": [
    "建议1：具体改进点",
    "建议2：具体改进点",
    "建议3：具体改进点"
  ]
}

【评分标准】
- 表达清晰度：语言流畅、用词准确、条理清晰
- 逻辑结构：论述有层次、因果关系明确
- 专业深度：专业知识扎实、理解透彻
- 应变能力：面对追问能灵活应对

请确保只输出JSON，不要有其他文字。`;
}
