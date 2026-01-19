import {
  INTERVIEW_MODES,
  INTERNET_POSITIONS,
  INTERVIEW_ROUNDS,
  INTERVIEW_DURATIONS,
  CIVIL_CATEGORIES,
  BEHAVIORAL_CATEGORIES,
  TECH_CATEGORIES,
  INTERVIEWER_STYLES,
  API_CONFIG,
} from "../lib/config";

describe("Config Module", () => {
  describe("API_CONFIG", () => {
    it("should have WS_URL configured", () => {
      expect(API_CONFIG.WS_URL).toBeDefined();
      expect(API_CONFIG.WS_URL).toContain("wss://");
    });

    it("should have BASE_URL configured", () => {
      expect(API_CONFIG.BASE_URL).toBeDefined();
      expect(API_CONFIG.BASE_URL).toContain("https://");
    });
  });

  describe("INTERVIEW_MODES", () => {
    it("should have 5 interview modes", () => {
      expect(INTERVIEW_MODES).toHaveLength(5);
    });

    it("should contain required modes", () => {
      const modeIds = INTERVIEW_MODES.map((m) => m.id);
      expect(modeIds).toContain("internet");
      expect(modeIds).toContain("civil");
      expect(modeIds).toContain("behavioral");
      expect(modeIds).toContain("resume");
      expect(modeIds).toContain("tech");
    });

    it("each mode should have required properties", () => {
      INTERVIEW_MODES.forEach((mode) => {
        expect(mode).toHaveProperty("id");
        expect(mode).toHaveProperty("title");
        expect(mode).toHaveProperty("description");
        expect(mode).toHaveProperty("detail");
      });
    });
  });

  describe("INTERNET_POSITIONS", () => {
    it("should have positions defined", () => {
      expect(Object.keys(INTERNET_POSITIONS).length).toBeGreaterThan(0);
    });

    it("should have 产品经理 position", () => {
      expect(INTERNET_POSITIONS["产品经理"]).toBeDefined();
      expect(INTERNET_POSITIONS["产品经理"].companies).toContain("字节跳动");
    });

    it("each position should have categories and companies", () => {
      Object.values(INTERNET_POSITIONS).forEach((position) => {
        expect(position.categories).toBeDefined();
        expect(position.categories.length).toBeGreaterThan(0);
        expect(position.companies).toBeDefined();
        expect(position.companies.length).toBeGreaterThan(0);
      });
    });
  });

  describe("INTERVIEW_ROUNDS", () => {
    it("should have 4 rounds", () => {
      expect(INTERVIEW_ROUNDS).toHaveLength(4);
    });

    it("should contain HR and business rounds", () => {
      const roundIds = INTERVIEW_ROUNDS.map((r) => r.id);
      expect(roundIds).toContain("hr");
      expect(roundIds).toContain("business");
      expect(roundIds).toContain("pressure");
      expect(roundIds).toContain("final");
    });
  });

  describe("INTERVIEW_DURATIONS", () => {
    it("should have 3 duration options", () => {
      expect(INTERVIEW_DURATIONS).toHaveLength(3);
    });

    it("each duration should have minutes and points", () => {
      INTERVIEW_DURATIONS.forEach((duration) => {
        expect(duration).toHaveProperty("minutes");
        expect(duration).toHaveProperty("points");
        expect(typeof duration.minutes).toBe("number");
        expect(typeof duration.points).toBe("number");
      });
    });
  });

  describe("CIVIL_CATEGORIES", () => {
    it("should have 6 categories", () => {
      expect(CIVIL_CATEGORIES).toHaveLength(6);
    });

    it("should contain comprehensive analysis", () => {
      const categoryIds = CIVIL_CATEGORIES.map((c) => c.id);
      expect(categoryIds).toContain("comprehensive");
    });

    it("each category should have label and description", () => {
      CIVIL_CATEGORIES.forEach((category) => {
        expect(category).toHaveProperty("id");
        expect(category).toHaveProperty("label");
        expect(category).toHaveProperty("description");
      });
    });
  });

  describe("BEHAVIORAL_CATEGORIES", () => {
    it("should have 6 categories", () => {
      expect(BEHAVIORAL_CATEGORIES).toHaveLength(6);
    });

    it("should contain leadership category", () => {
      const categoryIds = BEHAVIORAL_CATEGORIES.map((c) => c.id);
      expect(categoryIds).toContain("leadership");
      expect(categoryIds).toContain("teamwork");
    });
  });

  describe("TECH_CATEGORIES", () => {
    it("should have tech stacks defined", () => {
      expect(Object.keys(TECH_CATEGORIES).length).toBeGreaterThan(0);
    });

    it("should have Java stack", () => {
      expect(TECH_CATEGORIES["Java"]).toBeDefined();
      expect(TECH_CATEGORIES["Java"]).toContain("JVM");
    });

    it("should have Frontend stack", () => {
      expect(TECH_CATEGORIES["前端"]).toBeDefined();
      expect(TECH_CATEGORIES["前端"]).toContain("React");
    });
  });

  describe("INTERVIEWER_STYLES", () => {
    it("should have styles defined", () => {
      expect(Object.keys(INTERVIEWER_STYLES).length).toBeGreaterThan(0);
    });

    it("should have pressure style", () => {
      expect(INTERVIEWER_STYLES.pressure).toBeDefined();
      expect(INTERVIEWER_STYLES.pressure.voice).toBeDefined();
      expect(INTERVIEWER_STYLES.pressure.prompt).toBeDefined();
    });

    it("each style should have voice and prompt", () => {
      Object.values(INTERVIEWER_STYLES).forEach((style) => {
        expect(style).toHaveProperty("voice");
        expect(style).toHaveProperty("prompt");
        expect(typeof style.voice).toBe("string");
        expect(typeof style.prompt).toBe("string");
      });
    });
  });
});
