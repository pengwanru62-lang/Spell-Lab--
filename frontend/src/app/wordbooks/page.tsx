import { wordbookApi } from "@/services/api/wordbook";
import type { Wordbook } from "@/services/api/types";
import { cookies } from "next/headers";
import { WordbookList } from "./WordbookList";

export default async function WordbooksPage() {
  const token = (await cookies()).get("token")?.value;
  let wordbooks: Wordbook[] = [];
  try {
    wordbooks = await wordbookApi.listWordbooks(token);
  } catch {
    wordbooks = [];
  }

  return (
    <section className="min-h-[1080px] w-full bg-[#F8F8F8] pb-24 sm:pb-[453px]">
      <WordbookList initialWordbooks={wordbooks} />
    </section>
  );
}
