export type InterviewMode = "internet" | "civil" | "behavioral" | "resume" | "tech";

export type InterviewRound = "hr" | "business" | "pressure" | "final";

export interface InterviewSettings {
  mode: InterviewMode;
  position?: string;
  company?: string;
  round?: InterviewRound;
  duration: number; // minutes
  category?: string;
  resumeContent?: string;
}

export interface Message {
  id: string;
  role: "assistant" | "user";
  content: string;
  timestamp: number;
}

export interface InterviewResult {
  totalScore: number;
  dimensions: {
    name: string;
    score: number;
  }[];
  suggestions: string[];
  transcript: Message[];
}

export interface InterviewState {
  status: "idle" | "connecting" | "active" | "ending" | "completed";
  messages: Message[];
  currentTranscript: string;
  remainingTime: number;
  settings: InterviewSettings | null;
}
