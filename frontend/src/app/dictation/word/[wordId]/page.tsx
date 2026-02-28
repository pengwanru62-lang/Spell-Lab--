"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { wordbookApi } from "@/services/api/wordbook";
import type { Word } from "@/services/api/types";

export const dynamicParams = false;

function DictationWordDetailPageInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const wordId = Number(params.wordId);
  const chapterId = Number(searchParams.get("chapterId"));
  const wordbookId = Number(searchParams.get("wordbookId"));
  const [word, setWord] = useState<Word | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const words = await wordbookApi.listWords(chapterId);
        const target = words.items.find((item) => item.id === wordId) ?? null;
        if (mounted) {
          setWord(target);
        }
      } catch {
        if (mounted) {
          setWord(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    if (Number.isFinite(wordId) && Number.isFinite(chapterId)) {
      load();
    }
    return () => {
      mounted = false;
    };
  }, [wordId, chapterId]);

  const playAudio = () => {
    if (!word?.audioUrl) {
      return;
    }
    const audio = new Audio(word.audioUrl);
    audio.play();
  };

  if (loading) {
    return (
      <section className="min-h-[900px] rounded-[4px] bg-[#F8F8F8] px-4 py-8 sm:px-6 lg:px-[150px]">
        <div className="text-sm text-zinc-500">加载中...</div>
      </section>
    );
  }

  if (!word) {
    return (
      <section className="min-h-[900px] rounded-[4px] bg-[#F8F8F8] px-4 py-8 sm:px-6 lg:px-[150px]">
        <div className="text-sm text-zinc-500">未找到单词</div>
      </section>
    );
  }

  return (
    <section className="min-h-[900px] rounded-[4px] bg-[#F8F8F8] px-4 py-8 sm:px-6 lg:px-[150px]">
      <div className="flex items-center justify-between">
        <Link
          href={`/dictation/${wordbookId}/chapters/${chapterId}`}
          className="text-xl text-zinc-700"
        >
          &lt;
        </Link>
        <Link href={`/dictation/${wordbookId}`} className="text-sm text-zinc-500">
          返回章节
        </Link>
      </div>
      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-[2fr_1fr]">
        <div className="rounded-[8px] bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.08)]">
          <div className="text-3xl font-semibold text-zinc-900">{word.text}</div>
          <div className="mt-2 text-sm text-zinc-500">{word.pronunciation}</div>
          <div className="mt-4 flex items-center gap-4">
            <button
              onClick={playAudio}
              className="rounded-full border border-zinc-300 px-4 py-2 text-sm text-zinc-700"
            >
              播放发音
            </button>
            <button
              onClick={async () => {
                const nextValue = !word.familiar;
                await wordbookApi.updateFamiliar(word.id, nextValue);
                setWord({ ...word, familiar: nextValue });
              }}
              className={`rounded-full border px-4 py-2 text-sm ${word.familiar ? "border-[#2FBF71] text-[#2FBF71]" : "border-zinc-300 text-zinc-700"}`}
            >
              {word.familiar ? "已标熟" : "标熟"}
            </button>
          </div>
          <div className="mt-8 flex flex-col gap-2 text-sm text-zinc-500">
            {word.meanings?.map((meaning) => (
              <div key={meaning}>{meaning}</div>
            ))}
          </div>
          <div className="mt-3 text-sm text-zinc-500">例句占位</div>
        </div>
        <div className="rounded-[8px] bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.08)]">
          <div className="text-sm text-zinc-500">学习状态</div>
          <div className="mt-4 text-sm text-zinc-700">
            {word.familiar ? "已标熟" : "未标熟"}
          </div>
          <div className="mt-6 text-sm text-zinc-500">训练建议</div>
          <div className="mt-2 text-sm text-zinc-700">多听多写，巩固拼写。</div>
        </div>
      </div>
    </section>
  );
}

export default function DictationWordDetailPage() {
  return (
    <Suspense
      fallback={
        <section className="min-h-[900px] rounded-[4px] bg-[#F8F8F8] px-4 py-8 sm:px-6 lg:px-[150px]">
          <div className="text-sm text-zinc-500">加载中...</div>
        </section>
      }
    >
      <DictationWordDetailPageInner />
    </Suspense>
  );
}
