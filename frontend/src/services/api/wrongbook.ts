import { apiGet, apiPost } from "./client";
import type {
  AiTrainingHistoryItem,
  AiTrainingRecordSummary,
  AiTrainingResult,
  AiTrainingSession,
  TrainingUnit,
  WrongWord,
} from "./types";

export type WrongWordTrainRequest = {
  wordIds: number[];
};

export type AiTrainingStartRequest = {
  wordIds: number[];
};

export type AiTrainingSubmitRequest = {
  sessionId: number;
  index: number;
  answer: string;
};

export const wrongbookApi = {
  listWrongWords(token?: string) {
    return apiGet<WrongWord[]>("/api/wrong-words", token);
  },
  train(payload: WrongWordTrainRequest, token?: string) {
    return apiPost<TrainingUnit, WrongWordTrainRequest>(
      "/api/wrong-words/train",
      payload,
      token
    );
  },
  markKnown(payload: WrongWordTrainRequest, token?: string) {
    return apiPost<void, WrongWordTrainRequest>(
      "/api/wrong-words/mark-known",
      payload,
      token
    );
  },
  startAiTraining(payload: AiTrainingStartRequest, token?: string) {
    return apiPost<AiTrainingSession, AiTrainingStartRequest>(
      "/api/ai-trainings/start",
      payload,
      token
    );
  },
  getAiTrainingSession(sessionId: number, token?: string) {
    return apiGet<AiTrainingSession>(`/api/ai-trainings/${sessionId}`, token);
  },
  submitAiTraining(payload: AiTrainingSubmitRequest, token?: string) {
    return apiPost<AiTrainingSession, AiTrainingSubmitRequest>(
      "/api/ai-trainings/submit",
      payload,
      token
    );
  },
  abandonAiTraining(sessionId: number, token?: string) {
    return apiPost<void, Record<string, never>>(
      `/api/ai-trainings/${sessionId}/abandon`,
      {},
      token
    );
  },
  aiTrainingHistory(token?: string) {
    return apiGet<AiTrainingRecordSummary[]>("/api/ai-trainings/history", token);
  },
  aiTrainingHistoryItems(token?: string) {
    return apiGet<AiTrainingHistoryItem[]>(
      "/api/ai-trainings/history/items",
      token
    );
  },
  aiTrainingResult(sessionId: number, token?: string) {
    return apiGet<AiTrainingResult>(
      `/api/ai-trainings/history/${sessionId}`,
      token
    );
  },
};
