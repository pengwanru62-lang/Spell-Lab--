"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { wordbookApi } from "@/services/api/wordbook";
import type { Wordbook } from "@/services/api/types";

interface Props {
  initialWordbooks: Wordbook[];
}

export function WordbookList({ initialWordbooks }: Props) {
  const router = useRouter();
  const [wordbooks, setWordbooks] = useState<Wordbook[]>(initialWordbooks);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedWordbookId, setSelectedWordbookId] = useState<number | null>(null);
  const [newBookName, setNewBookName] = useState("");
  const [importFile, setImportFile] = useState<{
    name: string;
    type: string;
    lastModified: number;
    buffer: ArrayBuffer;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  // Separate system and custom wordbooks
  const systemWordbooks = wordbooks.filter((b) => b.type === "system");
  const customWordbooks = wordbooks.filter((b) => b.type === "custom");

  // Show all mixed or separated? The screenshot shows "Wordbook List" selected, likely all or system.
  // And "Custom Wordbook" as a separate tab.
  // But the grid shows "Add Custom Wordbook" at the end. This suggests a mixed view or specific section.
  // I'll show all, with custom ones having edit/import options.

  const handleCreate = async () => {
    if (!newBookName.trim()) return;
    try {
      setLoading(true);
      const newBook = await wordbookApi.createWordbook(newBookName);
      setWordbooks((prev) => [...prev, newBook]);
      setShowCreateModal(false);
      setNewBookName("");
      // Prompt to import immediately
      if (confirm("创建成功！是否立即导入单词？")) {
        setSelectedWordbookId(newBook.id);
        setShowImportModal(true);
      }
    } catch (error) {
      alert("创建失败: " + (error instanceof Error ? error.message : "未知错误"));
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!selectedWordbookId || !importFile) return;
    try {
      setLoading(true);
      const safeFile = new File([importFile.buffer], importFile.name, {
        type: importFile.type || "application/octet-stream",
        lastModified: importFile.lastModified,
      });
      await wordbookApi.importWords(selectedWordbookId, safeFile);
      alert("导入成功");
      setShowImportModal(false);
      setImportFile(null);
      
      // Refresh list to update counts
      // In a real app, we might just update the local state if the API returned the updated book
      // But listWordbooks is cheap enough here
      const updatedList = await wordbookApi.listWordbooks();
      setWordbooks(updatedList);
    } catch (error) {
      alert("导入失败: " + (error instanceof Error ? error.message : "未知错误"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mx-auto mt-10 flex w-full max-w-[1128px] flex-wrap justify-center gap-6 px-4 sm:mt-16 sm:justify-start sm:gap-8 sm:px-6 lg:mt-20 lg:gap-[50px] lg:px-[150px]">
        {/* Render Wordbooks */}
        {wordbooks.map((book) => (
          <div
            key={book.id}
            className="group relative flex h-[209px] w-[148px] flex-col justify-between bg-[#BCBCBC] p-4 text-sm text-zinc-900 shadow-sm transition-shadow hover:shadow-md"
          >
            <div>
              <div className="text-base font-medium line-clamp-2">{book.name}</div>
              <div className="mt-1 text-xs text-zinc-600">{book.totalWords} 词</div>
            </div>
            
            {/* Custom Wordbook Actions */}
            {book.type === "custom" && (
              <div className="z-10 mt-2 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedWordbookId(book.id);
                    setShowImportModal(true);
                  }}
                  className="rounded bg-white px-2 py-1 text-xs text-blue-600 shadow hover:bg-zinc-50"
                >
                  导入单词
                </button>
              </div>
            )}
            
            <Link href={`/dictation/${book.id}`} className="absolute inset-0 z-0" />
          </div>
        ))}

        {/* Add Custom Wordbook Card */}
        <div
          onClick={() => setShowCreateModal(true)}
          className="flex h-[209px] w-[148px] cursor-pointer flex-col items-center justify-center bg-[#D9D9D9] px-3 py-[61px] text-center transition-colors hover:bg-[#C9C9C9]"
        >
          <div className="flex h-[52px] w-[52px] items-center justify-center overflow-hidden text-4xl font-light text-[#202020]">
            +
          </div>
          <div className="mt-2 text-sm leading-5 tracking-tight text-[#202020]">
            点击添加自定
            <br />
            义词书
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-[400px] rounded-lg bg-white p-6 shadow-xl animate-in fade-in zoom-in duration-200">
            <h3 className="mb-4 text-lg font-bold text-zinc-900">创建自定义词书</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">词书名称</label>
                <input
                  type="text"
                  className="w-full rounded border border-zinc-300 p-2 text-zinc-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="请输入词书名称"
                  value={newBookName}
                  onChange={(e) => setNewBookName(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                disabled={loading || !newBookName.trim()}
                className="rounded bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? "创建中..." : "创建"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-[400px] rounded-lg bg-white p-6 shadow-xl animate-in fade-in zoom-in duration-200">
            <h3 className="mb-4 text-lg font-bold text-zinc-900">导入单词</h3>
            <p className="mb-4 text-sm text-zinc-500">
              支持 CSV (.csv) 或 Excel (.xlsx, .xls) 文件。<br/>
              格式要求：第一列单词，第二列释义，第三列音标（可选）。
            </p>
            <div className="rounded border border-dashed border-zinc-300 p-4 text-center">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) {
                    setImportFile(null);
                    return;
                  }
                  void (async () => {
                    try {
                      const buffer = await file.arrayBuffer();
                      setImportFile({
                        name: file.name,
                        type: file.type,
                        lastModified: file.lastModified,
                        buffer,
                      });
                    } catch (error) {
                      setImportFile(null);
                      alert(
                        "读取文件失败: " +
                          (error instanceof Error ? error.message : "未知错误")
                      );
                    }
                  })();
                }}
                className="block w-full text-sm text-zinc-500 file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                }}
                className="rounded px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100"
              >
                取消
              </button>
              <button
                onClick={handleImport}
                disabled={loading || !importFile}
                className="rounded bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? "导入中..." : "导入"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
