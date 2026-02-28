"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { trainingApi } from "@/services/api/training";
import type { TrainingResult } from "@/services/api/types";

export const dynamicParams = false;

export default function DictationResultPage() {
  const params = useParams();
  const unitId = Number(params.unitId);
  const [result, setResult] = useState<TrainingResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const response = await trainingApi.result(unitId);
        if (mounted) {
          setResult(response);
        }
      } catch {
        if (mounted) {
          setResult(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    if (Number.isFinite(unitId)) {
      load();
    }
    return () => {
      mounted = false;
    };
  }, [unitId]);

  const playAudio = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audio.play();
  };

  if (loading) {
    return (
      <section className="min-h-[900px] rounded-[4px] bg-[#F8F8F8] px-4 py-8 sm:px-6 lg:px-[150px]">
        <div className="text-sm text-zinc-500">成绩加载中...</div>
      </section>
    );
  }

  if (!result) {
    return (
      <section className="min-h-[1080px] w-full bg-[#F8F8F8] pb-[191px]">
        <div className="mx-auto flex w-full max-w-[1568px] flex-col items-start bg-[#F8F8F8] px-4 pb-[191px] sm:px-6">
          <div className="text-sm text-zinc-500">暂无成绩数据</div>
        </div>
      </section>
    );
  }

  const answeredCount = result.rightWords.length + result.wrongWords.length;
  const totalWords = result.totalWords ?? answeredCount;
  const progressText = `${result.rightWords.length}/${totalWords}`;
  const correctRate = totalWords === 0 ? 0 : (result.rightWords.length * 100) / totalWords;
  const list = [
    ...result.wrongWords.map((word) => ({ ...word, isWrong: true })),
    ...result.rightWords.map((word) => ({ ...word, isWrong: false })),
  ];

  const playWordAudio = (word: { text: string; audioUrl: string }) => {
    if ("speechSynthesis" in window) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word.text);
      utterance.lang = "en-US";
      speechSynthesis.speak(utterance);
    } else {
      const audio = new Audio(word.audioUrl);
      audio.play();
    }
  };

  return (
    <section className="min-h-screen w-full overflow-x-hidden bg-[#F8F8F8]">
      <div className="mx-auto flex h-full w-full max-w-[1200px] flex-col items-start bg-[#F8F8F8] px-4 pt-6 sm:px-6">
        <Link href="/dictation">
          <div className="ml-0 h-6 w-6 overflow-hidden">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15 18L9 12L15 6"
                stroke="#202020"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </Link>

        <div className="mt-6 flex w-full flex-col items-start">
          <p className="text-2xl leading-8 tracking-[-0.72px] text-[#202020] sm:text-[32px] sm:leading-[46px] sm:tracking-[-0.96px]">
            正确率：{Math.round(correctRate)}%
          </p>
          <p className="mt-4 text-xl font-semibold leading-7 tracking-[-0.48px] text-black sm:text-2xl sm:leading-[35px] sm:tracking-[-0.72px]">
            {progressText}
          </p>
        </div>

        <div className="mt-[38px] flex w-full flex-col items-start">
          <div className="flex w-full flex-wrap justify-center gap-4 sm:justify-start">
            {list.map((word, index) => (
              <div
                key={`${word.id}-${index}`}
                className="flex h-[146px] w-full max-w-[360px] items-center pr-px shadow-[0px_0px_15px_0px_rgba(0,0,0,0.05)]"
              >
                <div className="ml-[-1px] flex w-full grow items-start justify-between rounded-lg bg-white px-6 py-2 pb-[13px] pl-6 pr-8 pt-2">
                  <div className="flex flex-col items-start gap-2">
                    <p
                      className={`shrink-0 self-stretch text-2xl tracking-[-0.72px] ${
                        word.isWrong ? "text-[#FF3B30]" : "text-[#202020]"
                      }`}
                    >
                      {word.text}
                    </p>
                    <div className="mr-[21px] flex h-5 min-w-[118px] shrink-0 items-center justify-between self-stretch">
                      <p className="flex h-5 w-[51px] items-center justify-center text-sm tracking-[-0.42px] text-[#999999]">
                        {word.pronunciation ? `英${word.pronunciation}` : ""}
                      </p>
                      <p className="flex h-5 w-[59px] items-center justify-center text-sm tracking-[-0.42px] text-[#999999]">
                        &nbsp;
                      </p>
                    </div>
                    {word.meanings?.map((meaning, i) => (
                      <p
                        key={i}
                        className="shrink-0 self-stretch text-base tracking-[-0.48px] text-[#666666]"
                      >
                        {meaning}
                      </p>
                    ))}
                  </div>
                  <button
                    onClick={() => playWordAudio(word)}
                    className="mt-[5px] h-6 w-6 overflow-hidden"
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
                        stroke="#666666"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M15.54 8.46C16.4774 9.39764 17.0041 10.6692 17.0041 11.995C17.0041 13.3208 16.4774 14.5924 15.54 15.53"
                        stroke="#666666"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
