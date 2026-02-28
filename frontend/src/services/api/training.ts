import { apiGet, apiPost } from "./client";
import type { TrainingResult, TrainingSubmitResult, TrainingUnit } from "./types";

export type TrainingUnitRequest = {
  wordbookId: number;
  chapterId: number;
  speed: number;
  repeat: number;
  resume: boolean;
};

export type TrainingSubmitRequest = {
  unitId: number;
  wordId: number;
  inputText: string;
};

export const trainingApi = {
  createUnit(payload: TrainingUnitRequest, token?: string) {
    return apiPost<TrainingUnit, TrainingUnitRequest>(
      "/api/training/units",
      payload,
      token
    );
  },
  getUnit(unitId: number, token?: string) {
    return apiGet<TrainingUnit>(`/api/training/units/${unitId}`, token);
  },
  submit(payload: TrainingSubmitRequest, token?: string) {
    return apiPost<TrainingSubmitResult, TrainingSubmitRequest>(
      "/api/training/submit",
      payload,
      token
    );
  },
  result(unitId: number, token?: string) {
    return apiGet<TrainingResult>(`/api/training/result/${unitId}`, token);
  },
};
