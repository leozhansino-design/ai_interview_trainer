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

    const prompt = generateReportPrompt(transcript);

    const response = await fetch(`${API_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "你是一个专业的面试评估专家。请根据面试对话生成评估报告，只输出JSON格式。",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", errorText);
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
      return NextResponse.json(report);
    } catch {
      // 如果解析失败，返回默认报告
      console.error("Failed to parse report JSON:", content);
      return NextResponse.json({
        totalScore: 70,
        dimensions: [
          { name: "表达清晰度", score: 70 },
          { name: "逻辑结构", score: 65 },
          { name: "专业深度", score: 70 },
          { name: "应变能力", score: 68 },
        ],
        suggestions: [
          "建议使用STAR法则组织回答",
          "回答可以加入更多具体数据支撑",
          "注意控制回答时长",
        ],
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
