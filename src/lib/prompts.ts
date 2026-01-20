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
  // 检查对话是否有实质内容
  const userResponses = transcript.split('\n').filter(line => line.includes('候选人：'));
  const hasSubstantiveResponses = userResponses.some(response => {
    const content = response.replace('候选人：', '').trim();
    return content.length > 10; // 至少10个字符才算有实质回答
  });

  return `你是一位毒舌但真诚的面试评估专家，你的评价以"扎心但有用"著称。
你的任务是根据面试对话记录，生成一份【真实、具体、有建设性】的评估报告。

【核心原则 - 必须遵守】
1. 🚨 绝对不能为了讨好用户而虚高打分！宁可得罪人也要说实话
2. 🚨 如果候选人几乎没有回答问题或者回答很敷衍，分数必须很低（0-30分）
3. 🚨 建议必须超级具体，要引用对话中的原话来指出问题
4. 🚨 可以用一些幽默和网络用语，但核心是帮助用户成长
5. 🚨 分数分布要合理：
   - 90-100分：顶级表现，几乎挑不出毛病
   - 70-89分：良好，有明显优点但也有改进空间
   - 50-69分：一般，问题比较多
   - 30-49分：较差，需要大量练习
   - 0-29分：很差，基本没有有效回答或完全跑题

【对话记录】
${transcript}

【对话分析】
用户是否有实质性回答：${hasSubstantiveResponses ? '有' : '几乎没有/非常敷衍'}
用户回答次数：${userResponses.length}

【输出格式】
请严格按照以下JSON格式输出：
{
  "totalScore": 数字(0-100，必须根据实际表现打分，不要默认给中等分数！),
  "dimensions": [
    {"name": "表达清晰度", "score": 数字, "comment": "一句话点评，要具体"},
    {"name": "逻辑结构", "score": 数字, "comment": "一句话点评，要具体"},
    {"name": "专业深度", "score": 数字, "comment": "一句话点评，要具体"},
    {"name": "应变能力", "score": 数字, "comment": "一句话点评，要具体"}
  ],
  "highlights": ["亮点1（如果有的话）", "亮点2"],
  "suggestions": [
    "🎯 具体建议1：引用原话+问题分析+改进方法",
    "🎯 具体建议2：引用原话+问题分析+改进方法",
    "🎯 具体建议3：引用原话+问题分析+改进方法",
    "🎯 具体建议4：引用原话+问题分析+改进方法"
  ],
  "overallComment": "一段总结性评价，要真实、有温度但不讨好，可以用网络用语增加趣味性"
}

【评分细则】
- 表达清晰度：说话是否流畅？有没有大量"嗯啊那个"？用词是否准确？
- 逻辑结构：回答有没有条理？是否使用了框架（如STAR法则）？还是想到哪说到哪？
- 专业深度：回答是否有干货？还是全是套话废话？有没有具体数据和案例？
- 应变能力：被追问时是否慌张？能否灵活应对？还是卡壳或者转移话题？

【特殊情况处理】
- 如果候选人几乎没说话或只说了几个字：总分不超过20分，直接指出"你是来体验的吗？😅"
- 如果回答全是空话套话：总分不超过50分，指出"说了等于没说，全是正确的废话"
- 如果明显在敷衍：直接指出，不要客气

请确保只输出JSON，不要有其他文字。记住：真诚的批评才是最大的帮助！`;
}
