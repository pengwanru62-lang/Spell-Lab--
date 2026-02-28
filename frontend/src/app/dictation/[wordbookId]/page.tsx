"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { wordbookApi } from "@/services/api/wordbook";
import type { Chapter, Word, Wordbook } from "@/services/api/types";

export const dynamicParams = false;

export default function DictationChaptersPage() {
  const params = useParams();
  const router = useRouter();
  const wordbookId = Number(params.wordbookId);
  const [wordbooks, setWordbooks] = useState<Wordbook[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);
  const [searchText, setSearchText] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<Word | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [fetchedWordbooks, fetchedChapters] = await Promise.all([
          wordbookApi.listWordbooks(),
          Number.isFinite(wordbookId)
            ? wordbookApi.listChapters(wordbookId)
            : Promise.resolve([]),
        ]);

        if (mounted) {
          setWordbooks(Array.isArray(fetchedWordbooks) ? fetchedWordbooks : []);
          setChapters(Array.isArray(fetchedChapters) ? fetchedChapters : []);
        }
      } catch (error) {
        console.error("Failed to load data", error);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [wordbookId]);

  const totalWords = chapters.reduce(
    (sum, chapter) => sum + chapter.totalWords,
    0
  );

  const handleStartTrain = (resume: boolean) => {
    if (!Number.isFinite(wordbookId) || selectedChapterId === null) {
      return;
    }
    const resumeValue = resume ? 1 : 0;
    router.push(
      `/dictation/train?wordbookId=${wordbookId}&chapterId=${selectedChapterId}&resume=${resumeValue}`
    );
    setSelectedChapterId(null);
  };

  const handleSearch = async () => {
    const keyword = searchText.trim();
    if (!keyword || !Number.isFinite(wordbookId)) {
      return;
    }
    try {
      setSearching(true);
      const result = await wordbookApi.searchWord(wordbookId, keyword);
      if (result) {
        setSearchResult(result);
      } else {
        setSearchResult(null);
        alert("未找到该单词");
      }
    } catch (error) {
      setSearchResult(null);
      alert("搜索失败: " + (error instanceof Error ? error.message : "未知错误"));
    } finally {
      setSearching(false);
    }
  };

  const playWordAudio = (word: { text: string; audioUrl: string }) => {
    if ("speechSynthesis" in window) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word.text);
      utterance.lang = "en-US";
      speechSynthesis.speak(utterance);
    } else if (word.audioUrl) {
      const audio = new Audio(word.audioUrl);
      audio.play();
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#F8F8F8] md:flex-row">
      {/* Sidebar - Book List */}
      <aside className="flex w-full flex-row gap-2 overflow-x-auto bg-[#F8F8F8] px-4 py-3 md:w-[180px] md:flex-col md:overflow-y-auto md:px-2 md:pt-4">
        {wordbooks.map((book) => {
          const active = book.id === wordbookId;
          return (
            <Link
              key={book.id}
              href={`/dictation/${book.id}`}
              className={`flex min-h-[40px] w-full items-center justify-center px-4 py-2 text-center text-sm transition-colors ${
                active
                  ? "bg-[#BCD3ED] font-medium text-[#202020]"
                  : "text-[#202020] hover:bg-gray-200"
              }`}
            >
              {book.name}
            </Link>
          );
        })}
      </aside>

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-hidden bg-white">
        {/* Header */}
        <header className="flex min-h-[60px] flex-col gap-3 border-b border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.history.back()}
              className="mr-2 text-gray-500 hover:text-gray-700"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15 18L9 12L15 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-4">
            <span className="text-sm text-[#666666]">共{totalWords}个单词</span>
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <input
                type="text"
                placeholder="请输入搜索内容"
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleSearch();
                    }
                  }}
                className="h-[32px] w-full rounded border border-[#999999] px-3 text-sm text-[#202020] placeholder-[#999999] focus:border-[#007AFF] focus:outline-none sm:w-[240px]"
              />
                <button
                  className="h-[32px] rounded bg-[#007AFF] px-6 text-sm text-white hover:bg-blue-600 disabled:opacity-60"
                  onClick={handleSearch}
                  disabled={searching}
                >
                  {searching ? "搜索中..." : "搜索"}
              </button>
            </div>
          </div>
        </header>

        {/* Chapter Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
            {chapters.map((chapter) => {
              const percent =
                chapter.totalWords === 0
                  ? 0
                  : Math.round(
                      (chapter.answeredCount / chapter.totalWords) * 100
                    );
              const isNotStarted = chapter.answeredCount === 0;
              const sectionName = chapter.orderNo
                ? `第${chapter.orderNo}节`
                : chapter.name;
              const answeredCount = Math.min(
                chapter.answeredCount,
                chapter.totalWords
              );
              const correctCount = Math.min(
                chapter.correctCount,
                answeredCount
              );

              return (
                <div
                  key={chapter.id}
                  className="flex flex-col justify-between rounded-lg border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      {/* Placeholder for Chapter Image/Icon */}
                      <div className="h-[72px] w-[72px] bg-[#D9D9D9]"></div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-medium text-[#202020]">
                            {sectionName}
                          </span>
                          {isNotStarted && (
                            <span className="rounded border border-[#999999] px-1 text-[10px] text-[#999999]">
                              未听写
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-[#202020]">
                          {chapter.totalWords}词
                        </span>
                        <span className="text-xs text-[#202020]">
                          正确率：
                          {isNotStarted
                            ? "暂无"
                            : `${Math.round((correctCount / answeredCount) * 100)}%`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex items-end justify-between">
                    <span className="text-xs text-[#202020]">
                      进度：{answeredCount}/{chapter.totalWords}
                    </span>
                    <div className="flex gap-2">
                      <Link
                        href={`/dictation/${wordbookId}/chapters/${chapter.id}?page=1`}
                        className="rounded border border-[#999999] px-3 py-1 text-xs text-[#202020] hover:bg-gray-50"
                      >
                        列表
                      </Link>
                      <Link
                        href={`/dictation/train?wordbookId=${wordbookId}&chapterId=${chapter.id}`}
                        className="rounded border border-[#999999] px-3 py-1 text-xs text-[#202020] hover:bg-gray-50"
                        onClick={(event) => {
                          event.preventDefault();
                          setSelectedChapterId(chapter.id);
                        }}
                      >
                        听写
                      </Link>
                    </div>
                  </div>

                  {/* Progress Bar - Only if not 100% or based on design preference */}
                  {/* Design shows a line at bottom if active? Or just spacing. The image shows a bottom border or progress line. */}
                  {/* Let's add the progress bar as seen in previous implementation if needed, but the Figma screenshot shows it at the bottom of the card or separate. */}
                  {/* Re-checking screenshot: There is a grey bar at the bottom, and a darker grey progress fill. */}
                  <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-[#E5E5E5]">
                    <div
                      className="h-full bg-[#C1C1C1]"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
      {selectedChapterId !== null ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-[360px] rounded-lg bg-white p-6">
            <div className="text-base font-medium text-[#202020]">选择开始方式</div>
            <div className="mt-2 text-sm text-[#666666]">请选择本次听写起点</div>
            <div className="mt-6 flex flex-col gap-3">
              <button
                className="h-10 rounded bg-[#BCD3ED] text-sm text-[#202020] hover:bg-[#BCD3ED]"
                onClick={() => handleStartTrain(true)}
              >
                从上一次结束位置开始
              </button>
              <button
                className="h-10 rounded bg-[#BCD3ED] text-sm text-[#202020] hover:bg-[#BCD3ED]"
                onClick={() => handleStartTrain(false)}
              >
                从头开始
              </button>
            </div>
            <button
              className="mt-4 h-9 w-full rounded border border-[#999999] text-sm text-[#202020] hover:bg-gray-50"
              onClick={() => setSelectedChapterId(null)}
            >
              取消
            </button>
          </div>
        </div>
      ) : null}
      {searchResult ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="flex w-full max-w-[420px] flex-col gap-4 rounded-lg bg-white p-6">
            <div className="flex items-center justify-between">
              <div className="text-base font-medium text-[#202020]">单词查询结果</div>
              <button
                className="text-sm text-[#666666] hover:text-[#202020]"
                onClick={() => setSearchResult(null)}
              >
                关闭
              </button>
            </div>
            <div className="flex h-[160px] w-full justify-between rounded-[8px] bg-white px-6 pb-[13px] pt-8 shadow-[0_0_15px_0_rgba(0,0,0,0.05)]">
              <div className="flex flex-col gap-2">
                <div className="text-lg leading-7 tracking-[-0.48px] text-[#202020] sm:text-2xl sm:leading-[35px] sm:tracking-[-0.72px]">
                  {searchResult.text}
                </div>
                <div className="flex items-center gap-[21px] text-sm leading-5 tracking-[-0.42px] text-[#999999]">
                  <div>
                    {searchResult.pronunciation
                      ? `英${searchResult.pronunciation}`
                      : "英-"}
                  </div>
                </div>
                <div className="flex flex-col gap-1 text-base leading-[23px] tracking-[-0.48px] text-[#666666]">
                  {searchResult.meanings?.map((meaning) => (
                    <div key={meaning}>{meaning}</div>
                  ))}
                </div>
              </div>
              <div className="mt-[5px] flex flex-col items-center gap-[72px]">
                <button
                  type="button"
                  className="h-6 w-6 cursor-pointer hover:opacity-70"
                  onClick={() => playWordAudio(searchResult)}
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
                  className={`flex h-6 w-[24px] items-center justify-center rounded-[4px] border px-[11px] text-base leading-[23px] tracking-[-0.48px] transition-colors ${
                    searchResult.familiar
                      ? "border-[#999999] bg-[#D7E5F2] text-[#202020]"
                      : "border-[#999999] text-[#202020]"
                  }`}
                  onClick={async () => {
                    const nextValue = !searchResult.familiar;
                    await wordbookApi.updateFamiliar(searchResult.id, nextValue);
                    setSearchResult({ ...searchResult, familiar: nextValue });
                  }}
                >
                  <span className="whitespace-nowrap">熟</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
