"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi } from "@/services/api/auth";
import { trainingApi } from "@/services/api/training";
import { wordbookApi } from "@/services/api/wordbook";
import type { Chapter, TrainingSubmitResult, TrainingUnit, Wordbook } from "@/services/api/types";

const speedOptions = [0.5, 0.75, 1, 1.5, 2];
const repeatOptions = [1, 2, 3];

function DictationTrainPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const unitId = Number(searchParams.get("unitId"));
  const wordbookId = Number(searchParams.get("wordbookId"));
  const chapterId = Number(searchParams.get("chapterId"));
  const resumeParam = searchParams.get("resume");
  const resume = resumeParam === "1" || resumeParam === "true";
  const [unit, setUnit] = useState<TrainingUnit | null>(null);
  const [wordbooks, setWordbooks] = useState<Wordbook[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [result, setResult] = useState<TrainingSubmitResult | null>(null);
  const [speed, setSpeed] = useState(1);
  const [repeat, setRepeat] = useState(1);
  const [baseSpeed, setBaseSpeed] = useState(1);
  const [baseRepeat, setBaseRepeat] = useState(1);
  const [loading, setLoading] = useState(true);
  const [settingsReady, setSettingsReady] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const playRequestIdRef = useRef(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadSettings() {
      try {
        const settings = await authApi.settings();
        if (mounted) {
          setSpeed(settings.speed);
          setRepeat(settings.repeat);
          setBaseSpeed(settings.speed);
          setBaseRepeat(settings.repeat);
        }
      } catch {
        if (mounted) {
          setSpeed(1);
          setRepeat(1);
          setBaseSpeed(1);
          setBaseRepeat(1);
        }
      } finally {
        if (mounted) {
          setSettingsReady(true);
        }
      }
    }
    loadSettings();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        if (Number.isFinite(unitId) && unitId > 0) {
          const created = await trainingApi.getUnit(unitId);
          if (mounted) {
            setWordbooks([]);
            setChapters([]);
            setUnit(created);
            setIndex(created.startIndex ?? 0);
            setInput("");
            setResult(null);
          }
        } else {
          const [books, chapterList, created] = await Promise.all([
            wordbookApi.listWordbooks(),
            wordbookApi.listChapters(wordbookId),
            trainingApi.createUnit({
              wordbookId,
              chapterId,
              speed: baseSpeed,
              repeat: baseRepeat,
              resume,
            }),
          ]);
          if (mounted) {
            setWordbooks(books);
            setChapters(chapterList);
            setUnit(created);
            setIndex(created.startIndex ?? 0);
            setInput("");
            setResult(null);
          }
        }
      } catch {
        if (mounted) {
          setUnit(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    const hasUnitId = Number.isFinite(unitId) && unitId > 0;
    const hasChapter = Number.isFinite(wordbookId) && Number.isFinite(chapterId);
    if (settingsReady && (hasUnitId || hasChapter)) {
      load();
    }
    return () => {
      mounted = false;
    };
  }, [settingsReady, unitId, wordbookId, chapterId, baseRepeat, baseSpeed, resume]);

  useEffect(() => {
    if (!loading && !result) {
      inputRef.current?.focus();
    }
  }, [index, result, loading, unit?.unitId]);

  useEffect(() => {
    if (!result) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        handleNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [result, unit, index]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const currentWord = unit?.words[index];
  const wordbookName = useMemo(
    () =>
      Number.isFinite(unitId) && unitId > 0
        ? "错词本"
        : wordbooks.find((book) => book.id === wordbookId)?.name ?? "",
    [unitId, wordbooks, wordbookId]
  );
  const chapterName = useMemo(
    () =>
      Number.isFinite(unitId) && unitId > 0
        ? "专项训练"
        : chapters.find((chapter) => chapter.id === chapterId)?.name ?? "",
    [unitId, chapters, chapterId]
  );

  const playSpeech = async (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      return;
    }
    const requestId = playRequestIdRef.current + 1;
    playRequestIdRef.current = requestId;
    window.speechSynthesis.cancel();
    const speakOnce = () =>
      new Promise<void>((resolve) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "en-US";
        utterance.rate = speed;
        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
        window.speechSynthesis.speak(utterance);
      });
    for (let i = 0; i < repeat; i++) {
      if (playRequestIdRef.current !== requestId) {
        return;
      }
      await speakOnce();
    }
  };

  useEffect(() => {
    if (currentWord && !result) {
      playSpeech(currentWord.text);
    }
  }, [currentWord?.id, repeat, speed, result]);

  const handleSubmit = async () => {
    if (!unit || !currentWord) {
      return;
    }
    const response = await trainingApi.submit({
      unitId: unit.unitId,
      wordId: currentWord.id,
      inputText: input,
    });
    setResult(response);
  };

  const handleNext = () => {
    if (!unit) {
      return;
    }
    if (index + 1 >= unit.words.length) {
      router.push(`/dictation/result/${unit.unitId}`);
      return;
    }
    setIndex((prev) => prev + 1);
    setInput("");
    setResult(null);
  };

  if (loading) {
    return (
      <section className="min-h-[900px] rounded-[4px] bg-[#F8F8F8] px-4 py-8 sm:px-6 lg:px-[150px]">
        <div className="text-sm text-zinc-500">训练加载中...</div>
      </section>
    );
  }

  if (!unit || !currentWord) {
    return (
      <section className="min-h-[900px] rounded-[4px] bg-[#F8F8F8] px-4 py-8 sm:px-6 lg:px-[150px]">
        <div className="text-sm text-zinc-500">暂无训练数据</div>
      </section>
    );
  }

  const cycleSpeed = () => {
    const index = speedOptions.indexOf(speed);
    const next = speedOptions[(index + 1) % speedOptions.length];
    setSpeed(next);
  };

  const cycleRepeat = () => {
    const index = repeatOptions.indexOf(repeat);
    const next = repeatOptions[(index + 1) % repeatOptions.length];
    setRepeat(next);
  };

  const handleExit = () => {
    setShowExitConfirm(true);
  };

  const handleConfirmExit = () => {
    if (unit) {
      router.push(`/dictation/result/${unit.unitId}`);
    } else {
      router.back();
    }
  };

  return (
    <section className="min-h-[900px] rounded-[4px] bg-white px-4 py-8 sm:px-6 lg:px-[150px]">
      <div className="flex items-center justify-between">
        <button
          className="text-xl text-zinc-700"
          onClick={handleExit}
        >
          &lt;
        </button>
        <div className="text-sm text-zinc-500">
          {wordbookName} / {chapterName} · {index + 1}/{unit.words.length}
        </div>
      </div>
      <div className="mt-10 flex flex-col items-center sm:mt-20">
        <div className="flex w-full flex-col items-center gap-4 text-sm text-zinc-600 sm:flex-row sm:justify-center sm:gap-6">
          <button onClick={cycleSpeed} className="text-sm text-zinc-600">
            倍速 {speed}x
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => currentWord && playSpeech(currentWord.text)}
              className="text-sm text-zinc-600"
            >
              重听
            </button>
            <button onClick={cycleRepeat} className="text-sm text-zinc-600">
              {repeat}遍
            </button>
          </div>
          <div className="relative flex w-full max-w-[240px] items-center justify-center sm:w-auto sm:min-w-[240px]">
            {result ? (
              <div
                className={`text-base font-medium ${
                  result.correct ? "text-[#2FBF71]" : "text-[#F04438]"
                }`}
              >
                {result.correctText}
              </div>
            ) : (
              <input
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    if (result) {
                      handleNext();
                    } else {
                      handleSubmit();
                    }
                  }
                }}
                className="w-full border-b border-zinc-300 bg-transparent text-center text-base text-zinc-900 outline-none"
                placeholder="请输入拼写"
              />
            )}
            <div className="pointer-events-none absolute left-0 right-0 top-[28px] h-px bg-zinc-300" />
          </div>
          <button
            onClick={result ? handleNext : handleSubmit}
            className="text-xl text-zinc-600"
          >
            &gt;
          </button>
        </div>
        {result ? (
          <div className="mt-10 flex flex-col gap-2 text-sm text-zinc-600">
            {currentWord.meanings?.map((meaning) => {
              const match = meaning.match(/^(\w+\.)\s*(.*)$/);
              if (!match) {
                return <div key={meaning}>{meaning}</div>;
              }
              return (
                <div key={meaning} className="flex gap-3">
                  <span className="text-[#2F6BFF]">{match[1]}</span>
                  <span>{match[2]}</span>
                </div>
              );
            })}
          </div>
        ) : null}
        {result ? (
          <div className={`mt-6 text-sm ${result.correct ? "text-[#2FBF71]" : "text-[#F04438]"}`}>
            {result.correct ? "正确" : "错误"}
          </div>
        ) : null}
      </div>
      {showExitConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-[360px] rounded-lg bg-white p-6">
            <div className="text-base font-medium text-[#202020]">
              确定要结束本次听写吗？
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="rounded border border-[#999999] px-4 py-1.5 text-sm text-[#202020] hover:bg-gray-50"
                onClick={() => setShowExitConfirm(false)}
              >
                取消
              </button>
              <button
                className="rounded bg-[#007AFF] px-4 py-1.5 text-sm text-white hover:bg-blue-600"
                onClick={handleConfirmExit}
              >
                确定
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default function DictationTrainPage() {
  return (
    <Suspense
      fallback={
        <section className="min-h-[900px] rounded-[4px] bg-[#F8F8F8] px-4 py-8 sm:px-6 lg:px-[150px]">
          <div className="text-sm text-zinc-500">训练加载中...</div>
        </section>
      }
    >
      <DictationTrainPageInner />
    </Suspense>
  );
}
