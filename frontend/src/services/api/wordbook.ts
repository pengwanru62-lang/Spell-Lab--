import { apiGet, apiPost } from "./client";
import type { Chapter, Word, WordPage, Wordbook } from "./types";

export const wordbookApi = {
  listWordbooks(token?: string) {
    return apiGet<Wordbook[]>("/api/wordbooks", token);
  },
  listChapters(wordbookId: number, token?: string) {
    return apiGet<Chapter[]>(`/api/wordbooks/${wordbookId}/chapters`, token);
  },
  listWords(chapterId: number, page = 1, size = 50, token?: string) {
    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
    });
    return apiGet<WordPage>(
      `/api/chapters/${chapterId}/words?${params.toString()}`,
      token
    );
  },
  searchWord(wordbookId: number, keyword: string, token?: string) {
    const params = new URLSearchParams({ keyword });
    return apiGet<Word | null>(
      `/api/wordbooks/${wordbookId}/search?${params.toString()}`,
      token
    );
  },
  updateFamiliar(wordId: number, familiar: boolean, token?: string) {
    return apiPost<boolean, undefined>(
      `/api/words/${wordId}/familiar?value=${familiar}`,
      undefined,
      token
    );
  },
  createWordbook(name: string, token?: string) {
    return apiPost<Wordbook, { name: string }>(
      "/api/wordbooks",
      { name },
      token
    );
  },
  importWords(wordbookId: number, file: File, token?: string) {
    const formData = new FormData();
    formData.append("file", file);
    return apiPost<boolean, FormData>(
      `/api/wordbooks/${wordbookId}/import`,
      formData,
      token
    );
  },
};
