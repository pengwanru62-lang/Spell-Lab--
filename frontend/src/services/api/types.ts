export type UserProfile = {
  id: number;
  nickname: string;
  avatar: string;
  banner: string;
};

export type UserSettings = {
  speed: number;
  repeat: number;
};

export type Wordbook = {
  id: number;
  name: string;
  type: string;
  totalWords: number;
};

export type Chapter = {
  id: number;
  name: string;
  orderNo: number;
  totalWords: number;
  status: string;
  progress: number;
  correctRate: number;
  answeredCount: number;
  correctCount: number;
};

export type Word = {
  id: number;
  text: string;
  pronunciation: string;
  audioUrl: string;
  familiar: boolean;
  meanings: string[];
};

export type WordPage = {
  items: Word[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
};

export type TrainingUnit = {
  unitId: number;
  words: Word[];
  startIndex: number;
};

export type TrainingSubmitResult = {
  correct: boolean;
  correctText: string;
  meaning: string;
};

export type TrainingResult = {
  correctRate: number;
  wrongWords: Word[];
  rightWords: Word[];
  totalWords: number;
};

export type WrongWord = {
  id: number;
  text: string;
  wrongCount: number;
  pronunciation: string;
  audioUrl: string;
  meanings: string[];
  lastWrongAt: string;
};

export type AiTrainingQuestion = {
  index: number;
  type: "cloze" | "blank" | "choice";
  prompt: string;
  passageText: string;
  audioText: string;
  options: string[];
};

export type AiTrainingSession = {
  sessionId: number;
  status: "in_progress" | "completed" | "abandoned";
  currentIndex: number;
  totalQuestions: number;
  wordCount: number;
  question: AiTrainingQuestion | null;
};

export type AiTrainingRecordSummary = {
  sessionId: number;
  date: string;
  startedAt: string;
  finishedAt: string;
  correctRate: number;
  wordCount: number;
};

export type AiTrainingHistoryItem = {
  sessionId: number;
  date: string;
  index: number;
  prompt: string;
  userAnswer: string;
  correctAnswer: string;
  audioText: string;
};

export type AiTrainingResultItem = {
  index: number;
  type: "cloze" | "blank" | "choice";
  prompt: string;
  passageText: string;
  audioText: string;
  passageTranslation: string;
  options: string[];
  userAnswer: string;
  correctAnswer: string;
  answerExplanation: string;
  correct: boolean;
  wrongWords: string[];
};

export type AiTrainingResult = {
  sessionId: number;
  startedAt: string;
  finishedAt: string;
  correctCount: number;
  totalQuestions: number;
  wordCount: number;
  items: AiTrainingResultItem[];
};

export type TrainingRecord = {
  id: number;
  type: string;
  startAt: string;
  endAt: string;
};

export type DailyStat = {
  date: string;
  studyMinutes: number;
  studyWords: number;
};

export type RecordSummaryStats = {
  date: string;
  todayWords: number;
  todayMinutes: number;
  totalMinutes: number;
  totalWords: number;
};
