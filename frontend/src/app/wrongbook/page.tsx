"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { wrongbookApi } from "@/services/api/wrongbook";
import type {
  AiTrainingHistoryItem,
  AiTrainingResult,
  AiTrainingSession,
  WrongWord,
} from "@/services/api/types";

function formatZhDateLabel(iso: string) {
  if (!iso) {
    return "";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

const resolveUserAnswer = (
  item: Record<string, unknown> & { userAnswer?: string }
) => {
  const candidates = [
    item.userAnswer,
    item["user_answer"],
    item["answer"],
    item["userAnswerText"],
  ];
  const value = candidates.find(
    (candidate) => typeof candidate === "string" && candidate.trim().length > 0
  );
  return typeof value === "string" ? value.trim() : "";
};

const resolveCorrectAnswer = (
  item: Record<string, unknown> & { correctAnswer?: string }
) => {
  const candidates = [
    item.correctAnswer,
    item["correct_answer"],
    item["correctAnswerText"],
  ];
  const value = candidates.find(
    (candidate) => typeof candidate === "string" && candidate.trim().length > 0
  );
  return typeof value === "string" ? value.trim() : "";
};

const getLocalAiAnswer = (sessionId: number | undefined, index: number) => {
  if (!sessionId || Number.isNaN(sessionId)) {
    return "";
  }
  if (typeof window === "undefined") {
    return "";
  }
  try {
    const stored = window.localStorage.getItem(
      `ai-answer:${sessionId}:${index}`
    );
    return stored ? stored.trim() : "";
  } catch {
    return "";
  }
};

const setLocalAiAnswer = (
  sessionId: number | undefined,
  index: number,
  answer: string
) => {
  if (!sessionId || Number.isNaN(sessionId)) {
    return;
  }
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(
      `ai-answer:${sessionId}:${index}`,
      answer.trim()
    );
  } catch {}
};

function WrongbookPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = searchParams.get("view") ?? "list";
  const sessionId = Number(searchParams.get("sessionId"));
  const detailIndex = Number(searchParams.get("index"));

  const [loading, setLoading] = useState(true);
  const [wrongWords, setWrongWords] = useState<WrongWord[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [errorText, setErrorText] = useState("");

  const [aiLoading, setAiLoading] = useState(false);
  const [aiSession, setAiSession] = useState<AiTrainingSession | null>(null);
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiChoice, setAiChoice] = useState("");
  const [aiSubmitting, setAiSubmitting] = useState(false);
  const [aiHistoryItems, setAiHistoryItems] = useState<AiTrainingHistoryItem[]>(
    []
  );
  const [aiResult, setAiResult] = useState<AiTrainingResult | null>(null);
  const [tabOpen, setTabOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [backConfirmOpen, setBackConfirmOpen] = useState(false);
  const [backConfirmSubmitting, setBackConfirmSubmitting] = useState(false);
  const autoPlayKeyRef = useRef("");
  const currentAiQuestion = aiSession?.question;

  const canSubmitAnswer = useMemo(() => {
    const question = aiSession?.question;
    if (!question) {
      return false;
    }
    if (question.type === "choice") {
      return Boolean(aiChoice);
    }
    return aiAnswer.trim().length > 0;
  }, [aiAnswer, aiChoice, aiSession]);

  const playSpeech = useCallback(async (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  }, []);

  const playWordAudio = (word: { text: string; audioUrl: string }) => {
    if ("speechSynthesis" in window) {
      playSpeech(word.text);
    } else if (word.audioUrl) {
      const audio = new Audio(word.audioUrl);
      audio.play();
    }
  };

  useEffect(() => {
    let mounted = true;
    async function loadWrongWords() {
      setLoading(true);
      setErrorText("");
      try {
        const data = await wrongbookApi.listWrongWords();
        if (mounted) {
          setWrongWords(data);
          setSelectedIds([]);
        }
      } catch (e) {
        if (mounted) {
          setWrongWords([]);
          setErrorText((e as Error).message || "错词加载失败");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    if (view === "list") {
      loadWrongWords();
    }
    return () => {
      mounted = false;
    };
  }, [view]);

  useEffect(() => {
    let mounted = true;
    async function loadAi() {
      if (!Number.isFinite(sessionId) || sessionId <= 0) {
        return;
      }
      setAiLoading(true);
      try {
        const data = await wrongbookApi.getAiTrainingSession(sessionId);
        if (mounted) {
          setAiSession(data);
        }
      } catch (e) {
        if (mounted) {
          setAiSession(null);
          setErrorText((e as Error).message || "训练加载失败");
        }
      } finally {
        if (mounted) {
          setAiLoading(false);
        }
      }
    }
    if (view === "ai") {
      loadAi();
    }
    return () => {
      mounted = false;
    };
  }, [view, sessionId]);

  useEffect(() => {
    if (view !== "ai") {
      return;
    }
    if (!currentAiQuestion || !currentAiQuestion.audioText) {
      return;
    }
    const key = `${aiSession?.sessionId ?? "unknown"}:${currentAiQuestion.index}:${currentAiQuestion.audioText}`;
    if (autoPlayKeyRef.current === key) {
      return;
    }
    autoPlayKeyRef.current = key;
    playSpeech(currentAiQuestion.audioText);
  }, [
    view,
    aiSession?.sessionId,
    currentAiQuestion,
    playSpeech,
  ]);

  useEffect(() => {
    let mounted = true;
    async function loadHistory() {
      setAiLoading(true);
      try {
        const data = await wrongbookApi.aiTrainingHistoryItems();
        if (mounted) {
          setAiHistoryItems(data);
        }
      } catch (e) {
        if (mounted) {
          setAiHistoryItems([]);
          setErrorText((e as Error).message || "训练记录加载失败");
        }
      } finally {
        if (mounted) {
          setAiLoading(false);
        }
      }
    }
    if (view === "ai-history") {
      loadHistory();
    }
    return () => {
      mounted = false;
    };
  }, [view]);

  useEffect(() => {
    let mounted = true;
    async function loadResult() {
      if (!Number.isFinite(sessionId) || sessionId <= 0) {
        return;
      }
      setAiLoading(true);
      try {
        const data = await wrongbookApi.aiTrainingResult(sessionId);
        if (mounted) {
          setAiResult(data);
        }
      } catch (e) {
        if (mounted) {
          setAiResult(null);
          setErrorText((e as Error).message || "结果加载失败");
        }
      } finally {
        if (mounted) {
          setAiLoading(false);
        }
      }
    }
    if (view === "ai-result") {
      loadResult();
    }
    return () => {
      mounted = false;
    };
  }, [view, sessionId]);

  const submitAiAnswer = useCallback(async () => {
    if (aiSubmitting) {
      return;
    }
    if (!aiSession || !aiSession.question) {
      return;
    }
    setAiSubmitting(true);
    const answer =
      aiSession.question.type === "choice" ? aiChoice : aiAnswer.trim();
    setLocalAiAnswer(aiSession.sessionId, aiSession.currentIndex, answer);
    try {
      const updated = await wrongbookApi.submitAiTraining({
        sessionId: aiSession.sessionId,
        index: aiSession.currentIndex,
        answer,
      });
      setAiAnswer("");
      setAiChoice("");
      setAiSession(updated);
      if (updated.status === "completed") {
        router.push(`/wrongbook?view=ai-result&sessionId=${updated.sessionId}`);
      }
    } finally {
      setAiSubmitting(false);
    }
  }, [aiAnswer, aiChoice, aiSession, aiSubmitting, router]);

  useEffect(() => {
    if (view !== "ai") {
      return;
    }
    const handler = (event: KeyboardEvent) => {
      if (event.key !== "Enter") {
        return;
      }
      if (event.isComposing || aiSubmitting || !canSubmitAnswer) {
        return;
      }
      event.preventDefault();
      submitAiAnswer();
    };
    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
    };
  }, [view, aiSubmitting, canSubmitAnswer, submitAiAnswer]);

  useEffect(() => {
    let mounted = true;
    async function loadDetail() {
      if (!Number.isFinite(sessionId) || sessionId <= 0) {
        return;
      }
      if (!Number.isFinite(detailIndex) || detailIndex < 0) {
        return;
      }
      setAiLoading(true);
      try {
        const data = await wrongbookApi.aiTrainingResult(sessionId);
        if (mounted) {
          setAiResult(data);
        }
      } catch (e) {
        if (mounted) {
          setAiResult(null);
          setErrorText((e as Error).message || "详情加载失败");
        }
      } finally {
        if (mounted) {
          setAiLoading(false);
        }
      }
    }
    if (view === "ai-detail") {
      loadDetail();
    }
    return () => {
      mounted = false;
    };
  }, [view, sessionId, detailIndex]);

  const groupedWrongWords = useMemo(() => {
    const groups = new Map<string, WrongWord[]>();
    for (const word of wrongWords) {
      const label = formatZhDateLabel(word.lastWrongAt);
      const key = label || "未记录日期";
      const list = groups.get(key) ?? [];
      list.push(word);
      groups.set(key, list);
    }
    return Array.from(groups.entries());
  }, [wrongWords]);

  const groupedAiHistoryItems = useMemo(() => {
    const groups = new Map<string, AiTrainingHistoryItem[]>();
    for (const item of aiHistoryItems) {
      const label = formatZhDateLabel(item.date);
      const key = label || item.date || "未记录日期";
      const list = groups.get(key) ?? [];
      list.push(item);
      groups.set(key, list);
    }
    return Array.from(groups.entries());
  }, [aiHistoryItems]);

  const goToView = (nextView: "list" | "ai-history") => {
    if (view === nextView) {
      return;
    }
    if (nextView === "list") {
      router.push("/wrongbook");
      return;
    }
    router.push(`/wrongbook?view=${nextView}`);
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const startDictation = async () => {
    if (selectedIds.length === 0) {
      return;
    }
    const unit = await wrongbookApi.train({ wordIds: selectedIds });
    router.push(`/dictation/train?unitId=${unit.unitId}`);
  };

  const startAiTraining = async () => {
    if (selectedIds.length === 0) {
      goToView("ai-history");
      return null;
    }
    if (selectedIds.length > 20) {
      setErrorText("最多只能选择 20 个错词开始训练");
      return null;
    }
    return await wrongbookApi.startAiTraining({ wordIds: selectedIds });
  };

  const openAiConfirm = () => {
    setErrorText("");
    if (selectedIds.length === 0) {
      goToView("ai-history");
      return;
    }
    setConfirmOpen(true);
  };


  const openBackConfirm = () => {
    setBackConfirmOpen(true);
  };

  const confirmBackToList = async () => {
    if (backConfirmSubmitting) {
      return;
    }
    setBackConfirmSubmitting(true);
    setBackConfirmOpen(false);
    if (!Number.isFinite(sessionId) || sessionId <= 0) {
      goToView("list");
      return;
    }
    await wrongbookApi.abandonAiTraining(sessionId);
    goToView("list");
  };

  const backToList = () => {
    goToView("list");
  };

  const TabSwitch = () => {
    const currentLabel = view === "ai-history" ? "AI训练记录" : "错词列表";
    return (
      <div className="relative">
        <button
          type="button"
          className="rounded-lg bg-white px-4 py-2 text-sm text-[#202020] shadow-[0px_0px_15px_0px_rgba(0,0,0,0.05)]"
          onClick={() => setTabOpen((v) => !v)}
        >
          {currentLabel}
        </button>
        {tabOpen ? (
          <div className="absolute left-0 top-[44px] w-[127px] overflow-hidden rounded-lg bg-white shadow-[0px_0px_15px_0px_rgba(0,0,0,0.05)]">
            <button
              type="button"
              className={`block w-full px-4 py-3 text-center text-sm text-[#202020] ${
                view !== "ai-history" ? "bg-[#BCD3ED]" : "bg-white"
              }`}
              onClick={() => {
                setTabOpen(false);
                goToView("list");
              }}
            >
              错词列表
            </button>
            <div className="h-px w-full bg-[#E5E5E5]" />
            <button
              type="button"
              className={`block w-full px-4 py-3 text-center text-sm text-[#202020] ${
                view === "ai-history" ? "bg-[#BCD3ED]" : "bg-white"
              }`}
              onClick={() => {
                setTabOpen(false);
                goToView("ai-history");
              }}
            >
              AI训练记录
            </button>
          </div>
        ) : null}
      </div>
    );
  };

  if (view === "ai-history") {
    return (
      <section className="min-h-[900px] w-full bg-[#F8F8F8]">
        <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <TabSwitch />
            </div>
            <div className="h-6 w-6" />
          </div>
          {aiLoading ? (
            <div className="mt-8 text-sm text-zinc-500">加载中...</div>
          ) : groupedAiHistoryItems.length === 0 ? (
            <div className="mt-8 text-sm text-zinc-500">暂无训练记录</div>
          ) : (
            <div className="mt-8 flex flex-col gap-6">
              {groupedAiHistoryItems.map(([label, items]) => (
                <div key={label}>
                  <div className="text-sm leading-[23px] tracking-[-0.48px] text-[#202020]">
                    {label}
                  </div>
                  <div className="mt-2 flex flex-col gap-6">
                    {[...items]
                      .sort((a, b) => {
                        const normalize = (value: string) => value.trim();
                        const aAnswer = normalize(resolveUserAnswer(a) || "");
                        const bAnswer = normalize(resolveUserAnswer(b) || "");
                        const aCorrectAnswer = normalize(resolveCorrectAnswer(a));
                        const bCorrectAnswer = normalize(resolveCorrectAnswer(b));
                        const aCorrect =
                          aAnswer !== "" && aAnswer === aCorrectAnswer;
                        const bCorrect =
                          bAnswer !== "" && bAnswer === bCorrectAnswer;
                        return Number(aCorrect) - Number(bCorrect);
                      })
                      .map((item) => {
                        const normalizedUser = resolveUserAnswer(item).trim();
                        const normalizedCorrect = resolveCorrectAnswer(item).trim();
                        const isCorrect =
                          normalizedUser !== "" &&
                          normalizedUser === normalizedCorrect;
                        return (
                      <div
                        key={`${item.sessionId}-${item.index}`}
                        role="button"
                        tabIndex={0}
                        onClick={() =>
                          router.push(
                            `/wrongbook?view=ai-detail&sessionId=${item.sessionId}&index=${item.index}`
                          )
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            router.push(
                              `/wrongbook?view=ai-detail&sessionId=${item.sessionId}&index=${item.index}`
                            );
                          }
                        }}
                        className="rounded-lg bg-white px-9 py-4 text-left shadow-[0px_0px_15px_0px_rgba(0,0,0,0.05)]"
                      >
                        <div className="flex items-start justify-between gap-6">
                          <div className="max-w-[900px] whitespace-pre-wrap text-lg leading-7 tracking-[-0.48px] text-[#202020] sm:text-2xl sm:leading-[35px] sm:tracking-[-0.72px]">
                            {item.prompt}
                          </div>
                          <div
                            className="h-6 w-6 flex-none cursor-pointer hover:opacity-70"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              playSpeech(item.audioText);
                            }}
                            aria-label="播放"
                          >
                            <svg
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M11 5L6 9H2V15H6L11 19V5Z"
                                stroke="#202020"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M15.54 8.46C16.4774 9.39764 17.004 10.6692 17.004 12C17.004 13.3308 16.4774 14.6024 15.54 15.54M19.07 4.93C20.9447 6.80527 21.998 9.34836 21.998 12C21.998 14.6516 20.9447 17.1947 19.07 19.07"
                                stroke="#202020"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                        </div>
                        <div className="mt-14 flex items-center justify-between text-sm leading-[23px] tracking-[-0.48px] text-[#202020]">
                          <div className="text-[#202020]">
                            我的答案：
                            <span className={isCorrect ? "text-[#2FBF71]" : "text-[#F04438]"}>
                              {resolveUserAnswer(item) ||
                                getLocalAiAnswer(item.sessionId, item.index) ||
                                "未作答"}
                            </span>
                          </div>
                          <div className="text-[#202020]">
                            正确答案：
                            <span className="text-[#2FBF71]">
                              {resolveCorrectAnswer(item) || "-"}
                            </span>
                          </div>
                        </div>
                      </div>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          )}
          {errorText ? (
            <div className="mt-4 text-sm text-[#FF3B30]">{errorText}</div>
          ) : null}
        </div>
      </section>
    );
  }

  if (view === "ai") {
    const question = aiSession?.question;
    const progress = aiSession
      ? `${Math.min(aiSession.currentIndex + 1, aiSession.totalQuestions)}/${
          aiSession.totalQuestions
        }`
      : "";
    return (
      <section className="min-h-[900px] w-full bg-[#F8F8F8]">
        <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6">
          <div className="flex items-center justify-between">
            <button className="h-6 w-6 text-xl text-zinc-700" onClick={openBackConfirm}>
              &lt;
            </button>
            <div className="text-sm text-[#666666]">AI 训练 {progress}</div>
            <div className="w-6" />
          </div>

          {aiLoading ? (
            <div className="mt-10 text-sm text-zinc-500">加载中...</div>
          ) : !aiSession ? (
            <div className="mt-10 text-sm text-zinc-500">暂无训练数据</div>
          ) : aiSession.status === "completed" ? (
            <div className="mt-10 text-sm text-zinc-500">训练已完成</div>
          ) : !question ? (
            <div className="mt-10 text-sm text-zinc-500">加载题目失败</div>
          ) : (
            <div className="flex min-h-[600px] w-full flex-col items-center justify-center px-4 pb-10 pt-6 md:min-h-[700px] md:px-6">
              <div className="flex w-full max-w-[1120px] items-center justify-end"></div>
              <div className="relative -mt-[140px] w-full max-w-[1120px] rounded-lg bg-white p-6 shadow-[0px_0px_15px_0px_rgba(0,0,0,0.05)] sm:p-8 md:p-12">
                <button
                  type="button"
                  className="absolute right-6 top-6 h-6 w-6 hover:opacity-70"
                  onClick={() => playSpeech(question.audioText)}
                  aria-label="播放音频"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M11 5L6 9H2V15H6L11 19V5Z"
                      stroke="#202020"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M15.54 8.46C16.4774 9.39764 17.004 10.6692 17.004 12C17.004 13.3308 16.4774 14.6024 15.54 15.54"
                      stroke="#202020"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <div className="pr-10 text-[24px] font-semibold leading-[34px] tracking-[-0.6px] text-[#202020]">
                  {question.prompt}
                </div>
                {question.type === "choice" ? (
                  <div className="mt-10 flex flex-col gap-3">
                    {question.options.map((opt, idx) => {
                      const label = String.fromCharCode(65 + idx);
                      const selected = aiChoice === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setAiChoice(opt)}
                          className={`rounded border px-5 py-3 text-left text-base ${
                            selected
                              ? "border-[#007AFF] bg-[#EAF2FF] text-[#202020]"
                              : "border-[#E5E7EB] bg-white text-[#202020]"
                          }`}
                        >
                          {label}. {opt}
                        </button>
                      );
                    })}
                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        className={`h-6 w-3 hover:opacity-70 ${
                          canSubmitAnswer ? "" : "pointer-events-none opacity-30"
                        }`}
                        onClick={submitAiAnswer}
                        aria-label="下一题"
                      >
                        <svg
                          width="12"
                          height="24"
                          viewBox="0 0 12 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M2 4L10 12L2 20"
                            stroke="#202020"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-10 flex items-center gap-3">
                    <input
                      value={aiAnswer}
                      onChange={(e) => setAiAnswer(e.target.value)}
                      autoFocus
                      className="flex-1 rounded border border-[#E5E7EB] bg-white px-4 py-3 text-base text-[#202020] outline-none"
                      placeholder="请输入答案"
                    />
                    <button
                      type="button"
                      className={`h-6 w-3 hover:opacity-70 ${
                        canSubmitAnswer ? "" : "pointer-events-none opacity-30"
                      }`}
                      onClick={submitAiAnswer}
                      aria-label="下一题"
                    >
                      <svg
                        width="12"
                        height="24"
                        viewBox="0 0 12 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M2 4L10 12L2 20"
                          stroke="#202020"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {backConfirmOpen ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
              <div
                className="w-full max-w-[360px] rounded-[12px] bg-white p-6 shadow-lg"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="text-[18px] font-medium text-[#202020]">
                  确认放弃训练？
                </div>
                <div className="mt-2 text-sm text-zinc-600">
                  放弃后将返回错词列表。
                </div>
                <div className="mt-6 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setBackConfirmOpen(false)}
                    className="rounded-[6px] border border-zinc-200 px-4 py-2 text-sm text-[#202020] hover:bg-zinc-50"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={confirmBackToList}
                    className="rounded-[6px] bg-[#007AFF] px-4 py-2 text-sm text-white hover:bg-[#0A84FF]"
                  >
                    确认放弃
                  </button>
                </div>
              </div>
            </div>
          ) : null}
          {errorText ? (
            <div className="mt-4 text-sm text-[#FF3B30]">{errorText}</div>
          ) : null}
        </div>
      </section>
    );
  }

  if (view === "ai-detail") {
    const item = aiResult?.items.find((x) => x.index === detailIndex);
    const resolvedCorrectAnswer = item ? resolveCorrectAnswer(item) : "";
    const correctOptionIndex = item
      ? item.options.findIndex((opt) => opt === resolvedCorrectAnswer)
      : -1;
    const correctOptionLabel =
      correctOptionIndex >= 0 ? String.fromCharCode(65 + correctOptionIndex) : "";
    if (aiLoading) {
      return (
        <section className="min-h-[900px] w-full bg-[#F8F8F8]">
          <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6">
            <div className="text-sm text-zinc-500">加载中...</div>
          </div>
        </section>
      );
    }
    if (!aiResult || !item) {
      return (
        <section className="min-h-[900px] w-full bg-[#F8F8F8]">
          <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6">
            <button className="h-6 w-6 text-xl text-zinc-700" onClick={backToList}>
              &lt;
            </button>
            <div className="mt-6 text-sm text-zinc-500">暂无详情数据</div>
            {errorText ? (
              <div className="mt-4 text-sm text-[#FF3B30]">{errorText}</div>
            ) : null}
          </div>
        </section>
      );
    }
    return (
      <section className="min-h-[900px] w-full bg-[#F8F8F8]">
        <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6">
          <button
            className="h-6 w-6 text-xl text-zinc-700"
            onClick={() => router.push("/wrongbook?view=ai-history")}
          >
            &lt;
          </button>
          <div className="mx-auto mt-4 w-full max-w-[1120px] rounded-lg bg-white p-6 shadow-[0px_0px_15px_0px_rgba(0,0,0,0.05)] sm:p-10 md:p-12">
            <div className="flex items-start justify-between gap-6">
              <div className="whitespace-pre-wrap text-2xl leading-[35px] tracking-[-0.72px] text-[#202020]">
                {item.prompt}
              </div>
              <button
                type="button"
                className="mt-1 h-6 w-6 flex-none hover:opacity-70"
                onClick={() => playSpeech(item.audioText)}
                aria-label="播放"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M11 5L6 9H2V15H6L11 19V5Z"
                    stroke="#202020"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M15.54 8.46C16.4774 9.39764 17.004 10.6692 17.004 12C17.004 13.3308 16.4774 14.6024 15.54 15.54M19.07 4.93C20.9447 6.80527 21.998 9.34836 21.998 12C21.998 14.6516 20.9447 17.1947 19.07 19.07"
                    stroke="#202020"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
            {item.options.length > 0 ? (
              <div className="mt-8 flex flex-col gap-3">
                {item.options.map((opt, idx) => (
                  <div
                    key={`${item.index}-${opt}`}
                    className="rounded border border-[#E5E7EB] bg-white px-5 py-3 text-left text-base text-[#202020]"
                  >
                    {String.fromCharCode(65 + idx)}. {opt}
                  </div>
                ))}
              </div>
            ) : null}
            <div className="mt-16 flex items-center justify-between text-2xl leading-[35px] tracking-[-0.72px]">
              <div className="text-[#202020]">
                正确答案：
                <span className="text-[#2FBF71]">
                  {resolvedCorrectAnswer
                    ? `${correctOptionLabel ? `${correctOptionLabel}. ` : ""}${resolvedCorrectAnswer}`
                    : "-"}
                </span>
              </div>
              <div className="text-[#202020]">
                我的答案：
                <span className={item.correct ? "text-[#2FBF71]" : "text-[#F04438]"}>
                  {resolveUserAnswer(item) ||
                    getLocalAiAnswer(aiResult?.sessionId, item.index) ||
                    "-"}
                </span>
              </div>
            </div>
            <div className="mt-28">
              <div className="text-2xl leading-[35px] tracking-[-0.72px] text-[#202020]">
                原文：
              </div>
              <div className="mt-7 whitespace-pre-wrap text-2xl leading-[35px] tracking-[-0.72px] text-[#202020]">
                {item.audioText}
              </div>
              <div className="mt-10 text-2xl leading-[35px] tracking-[-0.72px] text-[#202020]">
                原文翻译：
              </div>
              <div className="mt-4 whitespace-pre-wrap text-2xl leading-[35px] tracking-[-0.72px] text-[#202020]">
                {item.passageTranslation || "-"}
              </div>
              <div className="mt-10 text-2xl leading-[35px] tracking-[-0.72px] text-[#202020]">
                答案解析：
              </div>
              <div className="mt-4 whitespace-pre-wrap text-2xl leading-[35px] tracking-[-0.72px] text-[#202020]">
                {item.answerExplanation || "-"}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (view === "ai-result") {
    if (aiLoading) {
      return (
        <section className="min-h-[900px] w-full bg-[#F8F8F8]">
          <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6">
            <div className="text-sm text-zinc-500">加载中...</div>
          </div>
        </section>
      );
    }
    if (!aiResult) {
      return (
        <section className="min-h-[900px] w-full bg-[#F8F8F8]">
          <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6">
            <button className="h-6 w-6 text-xl text-zinc-700" onClick={backToList}>
              &lt;
            </button>
            <div className="mt-6 text-sm text-zinc-500">暂无结果数据</div>
            {errorText ? (
              <div className="mt-4 text-sm text-[#FF3B30]">{errorText}</div>
            ) : null}
          </div>
        </section>
      );
    }
    const correctRate =
      aiResult.totalQuestions === 0
        ? 0
        : (aiResult.correctCount * 100) / aiResult.totalQuestions;
    return (
      <section className="min-h-[900px] w-full bg-[#F8F8F8]">
        <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6">
          <div className="flex items-center justify-between">
            <button className="h-6 w-6 text-xl text-zinc-700" onClick={backToList}>
              &lt;
            </button>
            <div className="text-[20px] font-semibold text-[#202020]">
              AI 训练结果
            </div>
            <div className="w-6" />
          </div>
          <div className="mt-8 rounded-lg bg-white p-6 shadow-[0px_0px_15px_0px_rgba(0,0,0,0.05)]">
            <div className="text-[32px] font-semibold leading-[46px] tracking-[-0.96px] text-[#202020]">
              正确率：{Math.round(correctRate)}%
            </div>
            <div className="mt-3 text-sm text-[#666666]">
              {aiResult.correctCount}/{aiResult.totalQuestions} 题 · {aiResult.wordCount} 词
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-6">
            {[...aiResult.items]
              .sort((a, b) => Number(a.correct) - Number(b.correct))
              .map((item) => (
              <div
                key={item.index}
                role="button"
                tabIndex={0}
                onClick={() =>
                  router.push(
                    `/wrongbook?view=ai-detail&sessionId=${aiResult.sessionId}&index=${item.index}`
                  )
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    router.push(
                      `/wrongbook?view=ai-detail&sessionId=${aiResult.sessionId}&index=${item.index}`
                    );
                  }
                }}
                className="rounded-lg bg-white px-9 py-4 text-left shadow-[0px_0px_15px_0px_rgba(0,0,0,0.05)]"
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="max-w-[900px] whitespace-pre-wrap text-lg leading-7 tracking-[-0.48px] text-[#202020] sm:text-2xl sm:leading-[35px] sm:tracking-[-0.72px]">
                    {item.prompt}
                  </div>
                  <div
                    className="h-6 w-6 flex-none cursor-pointer hover:opacity-70"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      playSpeech(item.audioText);
                    }}
                    aria-label="播放"
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M11 5L6 9H2V15H6L11 19V5Z"
                        stroke="#202020"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M15.54 8.46C16.4774 9.39764 17.004 10.6692 17.004 12C17.004 13.3308 16.4774 14.6024 15.54 15.54M19.07 4.93C20.9447 6.80527 21.998 9.34836 21.998 12C21.998 14.6516 20.9447 17.1947 19.07 19.07"
                        stroke="#202020"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
                <div className="mt-14 flex items-center justify-between text-sm leading-[23px] tracking-[-0.48px]">
                  <div className="text-[#202020]">
                    我的答案：
                    <span className={item.correct ? "text-[#2FBF71]" : "text-[#F04438]"}>
                      {resolveUserAnswer(item) ||
                        getLocalAiAnswer(aiResult.sessionId, item.index) ||
                        "未作答"}
                    </span>
                  </div>
                  <div className="text-[#202020]">
                    正确答案：
                    <span className="text-[#2FBF71]">
                      {resolveCorrectAnswer(item) || "-"}
                    </span>
                  </div>
                </div>
                <div className="mt-4 text-sm leading-[23px] tracking-[-0.48px] text-[#666666]">
                  原文翻译：{item.passageTranslation || "-"}
                </div>
                <div className="mt-2 text-sm leading-[23px] tracking-[-0.48px] text-[#666666]">
                  答案解析：{item.answerExplanation || "-"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-[900px] w-full bg-[#F8F8F8]">
      <div className="mx-auto mt-3 w-full max-w-[1180px] px-4 pb-6 pt-2 sm:px-0">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <TabSwitch />
          </div>
          <button
            onClick={startDictation}
            disabled={selectedIds.length === 0}
            className={`rounded-[4px] px-[18px] py-2 text-sm tracking-[-0.48px] ${
              selectedIds.length === 0
                ? "bg-[#BFD7FF] text-white"
                : "bg-[#007AFF] text-white"
            }`}
          >
            开始听写
          </button>
        </div>

        {loading ? (
          <div className="mt-10 text-sm text-zinc-500">加载中...</div>
        ) : groupedWrongWords.length === 0 ? (
          <div className="mt-10 text-sm text-zinc-500">暂无错词数据</div>
        ) : (
          <div className="mt-3 flex flex-col gap-6">
            {groupedWrongWords.map(([label, items]) => (
              <div key={label}>
                <div className="text-sm leading-[23px] tracking-[-0.48px] text-[#202020]">
                  {label}
                </div>
                <div className="mt-2 grid w-full grid-cols-1 justify-items-center gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3 lg:gap-[50px]">
                  {items.map((word) => {
                    const selected = selectedIds.includes(word.id);
                    const normalizedPronunciation = (word.pronunciation ?? "")
                      .trim()
                      .replace(/^\/+|\/+$/g, "");
                    const meanings = (word.meanings ?? []).slice(0, 2);
                    return (
                      <div
                        key={word.id}
                        className="flex h-[160px] w-full max-w-[360px] justify-between rounded-[8px] bg-white px-6 pb-[13px] pt-8 shadow-[0_0_15px_0_rgba(0,0,0,0.05)]"
                      >
                        <div className="flex flex-col gap-2">
                          <div className="text-2xl leading-[35px] tracking-[-0.72px] text-[#202020]">
                            {word.text}
                          </div>
                          <div className="flex min-h-5 items-center gap-[21px] text-sm leading-5 tracking-[-0.42px] text-[#999999]">
                            {normalizedPronunciation ? (
                              <>
                                <div className="whitespace-nowrap">
                                  英/{normalizedPronunciation}/
                                </div>
                                <div className="whitespace-nowrap">
                                  美/{normalizedPronunciation}/
                                </div>
                              </>
                            ) : null}
                            <div className="whitespace-nowrap">
                              错{word.wrongCount}次
                            </div>
                          </div>
                          <div className="flex min-h-[46px] flex-col gap-1 text-base leading-[23px] tracking-[-0.48px] text-[#666666]">
                            <div>{meanings[0] ?? "\u00A0"}</div>
                            <div>{meanings[1] ?? "\u00A0"}</div>
                          </div>
                        </div>
                        <div className="mt-[5px] flex flex-col items-center gap-[72px]">
                          <button
                            type="button"
                            className="h-6 w-6 cursor-pointer hover:opacity-70"
                            onClick={() =>
                              playWordAudio({
                                text: word.text,
                                audioUrl: word.audioUrl,
                              })
                            }
                            aria-label="播放"
                          >
                            <svg
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M11 5L6 9H2V15H6L11 19V5Z"
                                stroke="#202020"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M15.54 8.46C16.4774 9.39764 17.004 10.6692 17.004 12C17.004 13.3308 16.4774 14.6024 15.54 15.54M19.07 4.93C20.9447 6.80527 21.998 9.34836 21.998 12C21.998 14.6516 20.9447 17.1947 19.07 19.07"
                                stroke="#202020"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                          <button
                            type="button"
                            className="-mt-2 h-6 w-6 cursor-pointer hover:opacity-70"
                            onClick={() => toggleSelect(word.id)}
                            aria-label="选择"
                          >
                            {selected ? (
                              <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <circle
                                  cx="12"
                                  cy="12"
                                  r="11"
                                  fill="#719FDD"
                                  stroke="#719FDD"
                                  strokeWidth="2"
                                />
                                <path
                                  d="M7 12L10.1575 14.4558C10.9315 15.0578 12.0278 15.0099 12.7463 14.3427L18.5 9"
                                  stroke="white"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                />
                              </svg>
                            ) : (
                              <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <circle
                                  cx="12"
                                  cy="12"
                                  r="11"
                                  fill="white"
                                  stroke="#D9D9D9"
                                  strokeWidth="2"
                                />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={openAiConfirm}
          className="fixed bottom-12 right-12 flex h-16 w-16 flex-col items-center justify-center rounded-full bg-[#BDD2ED] shadow-[0px_0px_15px_0px_rgba(0,0,0,0.05)]"
          aria-label="AI训练"
        >
          <div className="text-center text-sm leading-[23px] tracking-[-0.48px] text-[#202020]">
            AI
            <br />
            训练
          </div>
        </button>

        {confirmOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#202020]/50">
            <div className="relative mx-4 w-full max-w-[520px] rounded-[10px] border border-[#E5E5E5] bg-white px-6 pb-6 pt-5 shadow-[0px_0px_15px_0px_rgba(0,0,0,0.05)] sm:px-[60px] sm:pb-[30px] sm:pt-[24px]">
              <button
                type="button"
                className="absolute right-6 top-6 h-[19px] w-[19px] text-[#202020]"
                onClick={() => setConfirmOpen(false)}
                aria-label="关闭"
              >
                ×
              </button>
              <div className="mt-8 text-center text-[24px] leading-[32px] tracking-[-0.6px] text-[#202020]">
                确认选择{selectedIds.length}个错词进行训练？
              </div>
              <div className="mt-[72px] flex items-center justify-between">
                <button
                  type="button"
                  className="rounded-[6px] bg-[#D9D9D9] px-[22px] py-[6px] text-base leading-[26px] tracking-[-0.48px] text-[#202020]"
                  onClick={() => setConfirmOpen(false)}
                >
                  取消
                </button>
                <button
                  type="button"
                  className="rounded-[6px] bg-[#007AFF] px-[22px] py-[6px] text-base leading-[26px] tracking-[-0.48px] text-white"
                  onClick={async () => {
                    setConfirmOpen(false);
                    setAiSession(null);
                    setAiLoading(true);
                    router.push("/wrongbook?view=ai");
                    try {
                      const session = await startAiTraining();
                      if (!session) {
                        setAiLoading(false);
                        return;
                      }
                      router.replace(
                        `/wrongbook?view=ai&sessionId=${session.sessionId}`
                      );
                    } catch (e) {
                      setAiLoading(false);
                      setErrorText((e as Error).message || "训练启动失败");
                    }
                  }}
                >
                  确认
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {errorText ? (
          <div className="mt-4 text-sm text-[#FF3B30]">{errorText}</div>
        ) : null}
      </div>
    </section>
  );
}

export default function WrongbookPage() {
  return (
    <Suspense
      fallback={
        <section className="min-h-[900px] w-full bg-[#F8F8F8]">
          <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6">
            <div className="text-sm text-zinc-500">加载中...</div>
          </div>
        </section>
      }
    >
      <WrongbookPageInner />
    </Suspense>
  );
}
