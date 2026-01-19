import { render, screen } from "@testing-library/react";
import Home from "../../app/page";

// Mock the next/navigation
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    };
  },
}));

describe("HomePage", () => {
  it("renders the hero section title", () => {
    render(<Home />);

    // Use getAllByText since AI 面试官 appears multiple times
    const titleElements = screen.getAllByText(/AI 面试官/i);
    expect(titleElements.length).toBeGreaterThan(0);
    expect(screen.getByText(/用真实压力，练出真本事/i)).toBeInTheDocument();
  });

  it("renders interview mode cards", () => {
    render(<Home />);

    // Check for civil service interview mode
    expect(screen.getByText(/公务员\/事业编面试/i)).toBeInTheDocument();

    // Check for behavioral interview mode
    expect(screen.getByText(/行为面试 STAR/i)).toBeInTheDocument();
  });

  it("renders start buttons", () => {
    render(<Home />);

    expect(screen.getByText(/开始公务员面试/i)).toBeInTheDocument();
    expect(screen.getByText(/开始行为面试/i)).toBeInTheDocument();
  });

  it("renders stats section", () => {
    render(<Home />);

    // Check for stats numbers
    expect(screen.getByText(/10000\+/)).toBeInTheDocument();
    expect(screen.getByText(/98%/)).toBeInTheDocument();
  });

  it("renders features section", () => {
    render(<Home />);

    // Check for feature highlights - use getAllByText for elements that appear multiple times
    const voiceElements = screen.getAllByText(/实时语音对练/i);
    expect(voiceElements.length).toBeGreaterThan(0);
    expect(screen.getByText(/智能追问/i)).toBeInTheDocument();

    // Use getAllByText since 详细评估报告 appears multiple times (title and description)
    const reportElements = screen.getAllByText(/详细评估报告/i);
    expect(reportElements.length).toBeGreaterThan(0);
  });

  it("renders other modes section", () => {
    render(<Home />);

    expect(screen.getByText(/互联网大厂/i)).toBeInTheDocument();
    expect(screen.getByText(/简历深挖/i)).toBeInTheDocument();
    expect(screen.getByText(/技术八股/i)).toBeInTheDocument();
  });

  it("renders call to action section", () => {
    render(<Home />);

    expect(screen.getByText(/准备好了吗/i)).toBeInTheDocument();
    expect(screen.getByText(/立即开始练习/i)).toBeInTheDocument();
  });
});
