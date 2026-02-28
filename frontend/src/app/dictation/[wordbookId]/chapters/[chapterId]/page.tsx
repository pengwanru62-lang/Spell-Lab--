"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { wordbookApi } from "@/services/api/wordbook";
import type { Word } from "@/services/api/types";

export const dynamicParams = false;

function DictationChapterWordsPageInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const wordbookId = Number(params.wordbookId);
  const chapterId = Number(params.chapterId);
  const pageParam = Number(searchParams.get("page"));
  const currentPage =
    Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const pageSize = 50;
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const wordPage = await wordbookApi.listWords(
          chapterId,
          currentPage,
          pageSize
        );
        if (mounted) {
          setWords(wordPage.items);
        }
      } catch {
        if (mounted) {
          setWords([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    if (Number.isFinite(wordbookId) && Number.isFinite(chapterId)) {
      load();
    }
    return () => {
      mounted = false;
    };
  }, [wordbookId, chapterId, currentPage]);

  const toggleFamiliar = async (word: Word) => {
    const nextValue = !word.familiar;
    await wordbookApi.updateFamiliar(word.id, nextValue);
    setWords((prev) =>
      prev.map((item) =>
        item.id === word.id ? { ...item, familiar: nextValue } : item
      )
    );
  };

  const speakWord = (text: string) => {
    if (typeof window === "undefined") {
      return;
    }
    const synth = window.speechSynthesis;
    if (!synth) {
      return;
    }
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    synth.speak(utterance);
  };

  if (loading) {
    return (
      <section className="min-h-[900px] rounded-[4px] bg-[#F8F8F8] px-4 py-6 sm:px-6 lg:px-[150px]">
        <div className="text-sm text-zinc-500">加载中...</div>
      </section>
    );
  }

  return (
    <section className="min-h-[1080px] w-full bg-[#F8F8F8] px-4 pt-1 sm:px-6">
      <div className="mx-auto mt-1 flex w-full max-w-[1248px] flex-col">
          <div className="mb-6 flex flex-col gap-3 px-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <Link
              href={`/dictation/${wordbookId}`}
              className="h-6 w-6 overflow-hidden cursor-pointer hover:opacity-70"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15.5 19L8.5 12L15.5 5"
                  stroke="#202020"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <Link
              href={`/dictation/train?wordbookId=${wordbookId}&chapterId=${chapterId}`}
              className="flex h-[35px] items-center rounded-[4px] bg-[#007AFF] px-[19px] py-2 text-base leading-[19px] tracking-[-0.48px] text-[#F8F8F8]"
            >
              开始听写
            </Link>
          </div>
          <div className="flex flex-wrap justify-center gap-4 px-4 sm:justify-start sm:px-6">
            {words.map((word) => (
              <div
                key={word.id}
                className={`flex h-[160px] w-full max-w-[360px] justify-between rounded-[8px] px-6 pb-[13px] pt-8 shadow-[0_0_15px_0_rgba(0,0,0,0.05)] ${
                  word.familiar ? "bg-[#D9D9D9]" : "bg-white"
                }`}
              >
                <div className="flex flex-col gap-2">
                  <div className="text-lg leading-7 tracking-[-0.48px] text-[#202020] sm:text-2xl sm:leading-[35px] sm:tracking-[-0.72px]">
                    {word.text}
                  </div>
                  <div className="flex items-center gap-[21px] text-sm leading-5 tracking-[-0.42px] text-[#999999]">
                    <div>英{word.pronunciation}</div>
                    <div>美{word.pronunciation}</div>
                  </div>
                  <div className="flex flex-col gap-1 text-base leading-[23px] tracking-[-0.48px] text-[#666666]">
                    {word.meanings?.slice(0, 2).map((meaning) => (
                      <div key={meaning}>{meaning}</div>
                    ))}
                  </div>
                </div>
                <div className="mt-[5px] flex flex-col items-center gap-[72px]">
                  <button
                    type="button"
                    onClick={() => speakWord(word.text)}
                    className="h-6 w-6 cursor-pointer hover:opacity-70"
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
                    onClick={() => toggleFamiliar(word)}
                    className={`flex h-6 w-[24px] items-center justify-center rounded-[4px] border border-[#999999] px-[11px] text-base leading-[23px] tracking-[-0.48px] text-[#202020] transition-colors ${
                      word.familiar ? "bg-[#D9D9D9]" : "bg-[#D7E5F2]"
                    }`}
                  >
                    <span className="whitespace-nowrap">熟</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
          {words.length === 0 ? (
            <div className="mt-6 px-4 text-sm text-zinc-500 sm:px-6">暂无单词</div>
          ) : null}
      </div>
    </section>
  );
}

export default function DictationChapterWordsPage() {
  return (
    <Suspense
      fallback={
        <section className="min-h-[900px] rounded-[4px] bg-[#F8F8F8] px-4 py-6 sm:px-6 lg:px-[150px]">
          <div className="text-sm text-zinc-500">加载中...</div>
        </section>
      }
    >
      <DictationChapterWordsPageInner />
    </Suspense>
  );
}
