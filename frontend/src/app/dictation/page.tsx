"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { wordbookApi } from "@/services/api/wordbook";
import type { Wordbook } from "@/services/api/types";

export default function DictationPage() {
  const [wordbooks, setWordbooks] = useState<Wordbook[]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const response = await wordbookApi.listWordbooks();
        if (mounted) {
          setWordbooks(Array.isArray(response) ? response : []);
        }
      } catch {
        if (mounted) {
          setWordbooks([]);
        }
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="min-h-[1080px] w-full bg-[#F8F8F8] pb-24 sm:pb-[453px]">
      <div className="mx-auto mt-10 flex w-full max-w-[1128px] flex-wrap justify-center gap-6 px-4 sm:mt-16 sm:justify-start sm:gap-8 sm:px-6 lg:mt-20 lg:gap-[50px] lg:px-[150px]">
        <Link
          href="/wordbooks"
          className="flex h-[209px] w-[148px] flex-col items-center justify-center bg-[#D9D9D9] px-3 py-[61px] text-center text-sm text-[#202020]"
        >
          <div className="flex h-[52px] w-[52px] items-center justify-center overflow-hidden">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 5V19M5 12H19"
                stroke="#202020"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="mt-2 text-sm leading-5 tracking-tight text-[#202020]">
            点击添加词书
            <br />
            进行听写
          </div>
        </Link>
        {wordbooks.map((book) => (
          <Link
            key={book.id}
            href={`/dictation/book?wordbookId=${book.id}`}
            className="flex h-[209px] w-[148px] flex-col justify-between bg-[#BCBCBC] p-4 text-sm text-zinc-900"
          >
            <div className="text-base font-medium">{book.name}</div>
            <div className="text-xs text-zinc-600">{book.totalWords} 词</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
