import { NextRequest, NextResponse } from "next/server";
import { generateReportPrompt } from "@/lib/prompts";

const API_KEY = process.env.OPENAI_API_KEY || "sk-z4a6qvhXCbfboOyBwL33BR66mJdHTKj5NO4pfIUSkLBm2jGF";
const API_BASE_URL = process.env.OPENAI_BASE_URL || "https://api.bltcy.ai/v1";

export async function POST(request: NextRequest) {
  try {
    const { transcript } = await request.json();

    if (!transcript) {
      return NextResponse.json(
        { error: "Missing transcript" },
        { status: 400 }
      );
    }

    // 检查是否有实质性对话内容
    const userLines = transcript.split('\n').filter((line: string) => line.includes('候选人：'));
    const hasSubstantiveContent = userLines.some((line: string) => {
      const content = line.replace('候选人：', '').trim();
      return content.length > 10;
    });

    // 如果几乎没有对话内容，直接返回低分报告
    if (userLines.length === 0 || !hasSubstantiveContent) {
      return NextResponse.json({
        totalScore: 5,
        dimensions: [
          { name: "表达清晰度", score: 5, comment: "你几乎没有说话，无法评估 🤷" },
          { name: "逻辑结构", score: 5, comment: "没有内容可分析，逻辑结构无从谈起" },
          { name: "专业深度", score: 5, comment: "完全没有展示任何专业内容" },
          { name: "应变能力", score: 5, comment: "连基本回应都没有，谈何应变" },
        ],
        highlights: [],
        suggestions: [
          "🎯 最基本的：你得开口说话啊！面试不是默剧表演 😅",
          "🎯 建议先从简单的自我介绍开始练习，克服紧张感",
          "🎯 准备一些常见问题的回答框架，至少做到有话可说",
          "🎯 如果是网络问题导致没有声音，请检查麦克风设置后重试",
        ],
        overallComment: "emmm...这场面试你基本上是来体验界面的吧？😂 没有关系，第一次紧张很正常。建议先对着镜子练习，或者用录音功能听听自己的声音，克服开口的心理障碍。记住：说得不好可以改进，但不开口就永远不会进步！加油，下次见~",
      });
    }

    const prompt = generateReportPrompt(transcript);

    const response = await fetch(`${API_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "gemini-2.5-flash-preview", // 切换到 Gemini 模型
        messages: [
          {
            role: "system",
            content: `你是一位资深的面试评估专家，以"毒舌但真诚"著称。
你的评价特点：
1. 绝不虚高打分，宁可得罪人也说实话
2. 建议超级具体，会引用原话指出问题
3. 会用一些幽默和网络用语，但核心是帮助用户成长
4. 分数客观真实：90+顶级、70-89良好、50-69一般、30-49较差、0-29很差
5. 如果用户表现差，你会直接指出，不会为了讨好而给中等分

请只输出JSON格式的评估报告，不要有其他文字。`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.8, // 稍微提高温度，让评价更有个性
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API error:", errorText);
      throw new Error("Failed to generate report");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // 尝试解析 JSON
    try {
      // 提取 JSON 部分（可能被 markdown 代码块包裹）
      let jsonStr = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }

      const report = JSON.parse(jsonStr);

      // 确保必要字段存在
      if (!report.highlights) {
        report.highlights = [];
      }
      if (!report.overallComment) {
        report.overallComment = "";
      }

      // 确保 dimensions 中有 comment 字段
      if (report.dimensions) {
        report.dimensions = report.dimensions.map((dim: { name: string; score: number; comment?: string }) => ({
          ...dim,
          comment: dim.comment || ""
        }));
      }

      return NextResponse.json(report);
    } catch (parseError) {
      // 如果解析失败，返回一个基于内容长度的默认报告
      console.error("Failed to parse report JSON:", content);

      // 根据对话内容给出更合理的默认分数
      const defaultScore = hasSubstantiveContent ? 55 : 15;

      return NextResponse.json({
        totalScore: defaultScore,
        dimensions: [
          { name: "表达清晰度", score: defaultScore, comment: "评估系统出了点问题，这是临时分数" },
          { name: "逻辑结构", score: defaultScore - 5, comment: "评估系统出了点问题，这是临时分数" },
          { name: "专业深度", score: defaultScore, comment: "评估系统出了点问题，这是临时分数" },
          { name: "应变能力", score: defaultScore - 3, comment: "评估系统出了点问题，这是临时分数" },
        ],
        highlights: [],
        suggestions: [
          "🎯 评估系统暂时出了点问题，但你的面试已经记录下来了",
          "🎯 建议稍后再试一次，或者回顾一下对话记录自我评估",
          "🎯 记住：每次练习都是进步的机会！",
        ],
        overallComment: "抱歉，AI评估系统临时抽风了 😅 但别担心，你的练习不会白费。可以看看对话记录，自己回顾一下哪里可以改进。技术问题我们会尽快修复的！",
      });
    }
  } catch (error) {
    console.error("Report generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
