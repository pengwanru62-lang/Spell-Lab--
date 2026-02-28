import { apiPost } from "./client";

export type FeedbackRequest = {
  content: string;
};

export const feedbackApi = {
  submit(payload: FeedbackRequest, token?: string) {
    return apiPost<string, FeedbackRequest>("/api/feedback", payload, token);
  },
};
