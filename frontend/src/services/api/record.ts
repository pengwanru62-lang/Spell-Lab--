import { apiGet } from "./client";
import type { DailyStat, RecordSummaryStats, TrainingRecord } from "./types";

export const recordApi = {
  listRecords(token?: string) {
    return apiGet<TrainingRecord[]>("/api/records", token);
  },
  listDailyStats(
    token?: string,
    params?: {
      from?: string;
      to?: string;
    }
  ) {
    const search = new URLSearchParams();
    if (params?.from) {
      search.set("from", params.from);
    }
    if (params?.to) {
      search.set("to", params.to);
    }
    const suffix = search.toString();
    return apiGet<DailyStat[]>(`/api/stats/daily${suffix ? `?${suffix}` : ""}`, token);
  },
  getSummary(token?: string, date?: string) {
    const search = new URLSearchParams();
    if (date) {
      search.set("date", date);
    }
    const suffix = search.toString();
    return apiGet<RecordSummaryStats>(
      `/api/stats/summary${suffix ? `?${suffix}` : ""}`,
      token
    );
  },
};
