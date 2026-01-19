import { generateInterviewPrompt, generateReportPrompt } from "../lib/prompts";

describe("Prompts Module", () => {
  describe("generateInterviewPrompt", () => {
    it("should generate internet interview prompt", () => {
      const prompt = generateInterviewPrompt({
        mode: "internet",
        position: "产品经理",
        company: "字节跳动",
        round: "business",
        duration: 15,
      });

      expect(prompt).toContain("字节跳动");
      expect(prompt).toContain("产品经理");
      expect(prompt).toContain("业务面试");
      expect(prompt).toContain("15分钟");
      expect(prompt).toContain("中文");
    });

    it("should generate civil service interview prompt", () => {
      const prompt = generateInterviewPrompt({
        mode: "civil",
        category: "comprehensive",
        duration: 30,
      });

      expect(prompt).toContain("公务员");
      expect(prompt).toContain("综合分析");
      expect(prompt).toContain("结构化面试");
      expect(prompt).toContain("30分钟");
    });

    it("should generate behavioral interview prompt", () => {
      const prompt = generateInterviewPrompt({
        mode: "behavioral",
        category: "leadership",
        duration: 15,
      });

      expect(prompt).toContain("行为面试");
      expect(prompt).toContain("领导力");
      expect(prompt).toContain("STAR");
    });

    it("should generate resume interview prompt", () => {
      const resumeContent = "5年产品经理经验，主导过用户增长项目";
      const prompt = generateInterviewPrompt({
        mode: "resume",
        resumeContent,
        position: "产品经理",
        duration: 30,
      });

      expect(prompt).toContain(resumeContent);
      expect(prompt).toContain("产品经理");
      expect(prompt).toContain("简历");
    });

    it("should generate tech interview prompt", () => {
      const prompt = generateInterviewPrompt({
        mode: "tech",
        techStack: "Java",
        category: "JVM",
        duration: 15,
      });

      expect(prompt).toContain("Java");
      expect(prompt).toContain("JVM");
      expect(prompt).toContain("技术面试");
    });

    it("should include time limit", () => {
      const prompt = generateInterviewPrompt({
        mode: "civil",
        category: "comprehensive",
        duration: 45,
      });

      expect(prompt).toContain("45分钟");
    });

    it("should include interviewer style based on round", () => {
      const pressurePrompt = generateInterviewPrompt({
        mode: "internet",
        position: "产品经理",
        company: "腾讯",
        round: "pressure",
        duration: 15,
      });

      expect(pressurePrompt).toContain("打断");
    });

    it("should include rules for Chinese communication", () => {
      const prompt = generateInterviewPrompt({
        mode: "behavioral",
        category: "teamwork",
        duration: 15,
      });

      expect(prompt).toContain("中文");
      expect(prompt).toContain("一个问题");
    });
  });

  describe("generateReportPrompt", () => {
    it("should generate report prompt with transcript", () => {
      const transcript = "面试官：请介绍你自己\n候选人：我是一名产品经理";
      const prompt = generateReportPrompt(transcript);

      expect(prompt).toContain(transcript);
      expect(prompt).toContain("评估报告");
      expect(prompt).toContain("JSON");
    });

    it("should include scoring dimensions", () => {
      const prompt = generateReportPrompt("test");

      expect(prompt).toContain("表达清晰度");
      expect(prompt).toContain("逻辑结构");
      expect(prompt).toContain("专业深度");
      expect(prompt).toContain("应变能力");
    });

    it("should include totalScore in format", () => {
      const prompt = generateReportPrompt("test");

      expect(prompt).toContain("totalScore");
      expect(prompt).toContain("dimensions");
      expect(prompt).toContain("suggestions");
    });
  });
});
