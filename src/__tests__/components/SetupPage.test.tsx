import { render, screen, act } from "@testing-library/react";
import SetupPage from "../../app/setup/page";

// Mock next/navigation - civil mode by default
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
    return new URLSearchParams("mode=civil");
  },
  usePathname() {
    return "/setup";
  },
}));

describe("SetupPage - Civil Service Interview Mode", () => {
  it("renders the civil service mode info", async () => {
    await act(async () => {
      render(<SetupPage />);
    });

    // Use getAllByText since text may appear multiple times
    const elements = screen.getAllByText(/公务员/);
    expect(elements.length).toBeGreaterThan(0);
  });

  it("renders category selection for civil mode", async () => {
    await act(async () => {
      render(<SetupPage />);
    });

    // Use getAllByText since categories have both label and description
    const comprehensiveElements = screen.getAllByText(/综合分析/);
    expect(comprehensiveElements.length).toBeGreaterThan(0);

    const planningElements = screen.getAllByText(/计划组织/);
    expect(planningElements.length).toBeGreaterThan(0);
  });

  it("renders duration selection", async () => {
    await act(async () => {
      render(<SetupPage />);
    });

    expect(screen.getByText(/15分钟/)).toBeInTheDocument();
    expect(screen.getByText(/30分钟/)).toBeInTheDocument();
    expect(screen.getByText(/45分钟/)).toBeInTheDocument();
  });

  it("renders start interview button", async () => {
    await act(async () => {
      render(<SetupPage />);
    });

    expect(screen.getByText(/开始面试/)).toBeInTheDocument();
  });

  it("renders back to home button", async () => {
    await act(async () => {
      render(<SetupPage />);
    });

    expect(screen.getByText(/返回首页/)).toBeInTheDocument();
  });

  it("renders all civil category options", async () => {
    await act(async () => {
      render(<SetupPage />);
    });

    // Use getAllByText for categories that may have multiple occurrences
    const interpersonalElements = screen.getAllByText(/人际关系/);
    expect(interpersonalElements.length).toBeGreaterThan(0);

    const emergencyElements = screen.getAllByText(/应急应变/);
    expect(emergencyElements.length).toBeGreaterThan(0);

    const simulationElements = screen.getAllByText(/情景模拟/);
    expect(simulationElements.length).toBeGreaterThan(0);

    const selfElements = screen.getAllByText(/自我认知/);
    expect(selfElements.length).toBeGreaterThan(0);
  });
});
