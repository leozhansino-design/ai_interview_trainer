import { render, screen, waitFor, act } from "@testing-library/react";
import ResultPage from "../../app/result/page";

// Mock data for testing
const mockInterviewData = {
  messages: [
    { id: "1", role: "assistant", content: "请介绍一下你自己", timestamp: Date.now() },
    { id: "2", role: "user", content: "我是一名产品经理", timestamp: Date.now() },
  ],
  settings: {
    mode: "civil",
    duration: 15,
    category: "comprehensive",
  },
};

// Mock next/navigation with data
const mockSearchParams = new URLSearchParams();
mockSearchParams.set("data", encodeURIComponent(JSON.stringify(mockInterviewData)));

jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    };
  },
  useSearchParams() {
    return mockSearchParams;
  },
  usePathname() {
    return "/result";
  },
}));

// Mock fetch for report generation
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: () =>
    Promise.resolve({
      totalScore: 75,
      dimensions: [
        { name: "表达清晰度", score: 80 },
        { name: "逻辑结构", score: 70 },
        { name: "专业深度", score: 75 },
        { name: "应变能力", score: 72 },
      ],
      suggestions: ["建议1", "建议2", "建议3"],
    }),
});

describe("ResultPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows loading state initially", async () => {
    await act(async () => {
      render(<ResultPage />);
    });

    // Use getAllByText since there are multiple matching elements
    const loadingElements = screen.getAllByText(/分析|生成/i);
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it("renders score after loading", async () => {
    await act(async () => {
      render(<ResultPage />);
    });

    await waitFor(
      () => {
        expect(screen.getByText(/评估报告/)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  it("renders dimension scores", async () => {
    await act(async () => {
      render(<ResultPage />);
    });

    await waitFor(
      () => {
        expect(screen.getByText(/表达清晰度/)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  it("renders improvement suggestions section", async () => {
    await act(async () => {
      render(<ResultPage />);
    });

    await waitFor(
      () => {
        const suggestionSection = screen.getByText(/改进建议/);
        expect(suggestionSection).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  it("renders action buttons", async () => {
    await act(async () => {
      render(<ResultPage />);
    });

    await waitFor(
      () => {
        expect(screen.getByText(/返回首页/)).toBeInTheDocument();
        expect(screen.getByText(/再来一次/)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });
});
