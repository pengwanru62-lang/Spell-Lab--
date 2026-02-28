"use client";

import type { ChangeEvent, MouseEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/services/api/auth";
import type { UserProfile } from "@/services/api/types";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [logoutSubmitting, setLogoutSubmitting] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deactivateSubmitting, setDeactivateSubmitting] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState("");
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackContent, setFeedbackContent] = useState("");
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [speed, setSpeed] = useState(1);
  const [repeat, setRepeat] = useState(1);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const speedOptions = [0.5, 0.75, 1, 1.5, 2];
  const repeatOptions = [1, 2, 3];
  const fallbackBanner =
    "https://upload.wikimedia.org/wikipedia/commons/3/30/Vincent_van_Gogh_-_Almond_blossom_-_Google_Art_Project.jpg";
  const fallbackAvatar =
    "https://upload.wikimedia.org/wikipedia/commons/f/f4/Red_Apple.jpg";
  const bannerUrl = useMemo(
    () => (profile?.banner ? profile.banner : fallbackBanner),
    [profile?.banner]
  );
  const avatarUrl = useMemo(
    () => (profile?.avatar ? profile.avatar : fallbackAvatar),
    [profile?.avatar]
  );

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await authApi.profile();
        if (mounted) {
          setProfile(data);
        }
      } catch {
        if (mounted) {
          setProfile(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadSettings() {
      if (!settingsOpen) {
        return;
      }
      setSettingsLoading(true);
      setSettingsMessage("");
      try {
        const settings = await authApi.settings();
        if (mounted) {
          setSpeed(settings.speed);
          setRepeat(settings.repeat);
        }
      } catch {
        if (mounted) {
          setSpeed(1);
          setRepeat(1);
        }
      } finally {
        if (mounted) {
          setSettingsLoading(false);
        }
      }
    }
    loadSettings();
    return () => {
      mounted = false;
    };
  }, [settingsOpen]);

  const handleLogout = () => {
    setLogoutOpen(true);
  };

  const confirmLogout = async () => {
    if (logoutSubmitting) {
      return;
    }
    setLogoutSubmitting(true);
    await authApi.logout();
    document.cookie = "token=; path=/; max-age=0";
    router.push("/login");
  };

  const handleDeactivate = async () => {
    setDeactivateOpen(true);
  };

  const confirmDeactivate = async () => {
    if (deactivateSubmitting) {
      return;
    }
    setDeactivateSubmitting(true);
    await authApi.deactivate();
    document.cookie = "token=; path=/; max-age=0";
    router.push("/login");
  };

  const handleSettings = () => {
    setSettingsOpen(true);
  };

  const handleFeedback = () => {
    setFeedbackMessage("");
    setFeedbackContent("");
    setFeedbackOpen(true);
  };

  const handleSaveSettings = async () => {
    if (settingsSaving) {
      return;
    }
    setSettingsSaving(true);
    setSettingsMessage("");
    try {
      const updated = await authApi.updateSettings({ speed, repeat });
      setSpeed(updated.speed);
      setRepeat(updated.repeat);
      setSettingsMessage("保存成功");
    } catch (err) {
      const text = err instanceof Error ? err.message : "保存失败，请稍后重试";
      setSettingsMessage(text);
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (feedbackSubmitting) {
      return;
    }
    const content = feedbackContent.trim();
    if (!content) {
      setFeedbackMessage("请输入反馈内容");
      return;
    }
    setFeedbackSubmitting(true);
    setFeedbackMessage("");
    try {
      await authApi.submitFeedback({ content });
      setFeedbackMessage("提交成功");
      setFeedbackContent("");
    } catch (err) {
      const text = err instanceof Error ? err.message : "提交失败，请稍后重试";
      setFeedbackMessage(text);
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const handleUpload = async (
    event: ChangeEvent<HTMLInputElement>,
    type: "avatar" | "banner"
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    const reader = new FileReader();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("读取失败"));
      reader.readAsDataURL(file);
    });
    const updated =
      type === "avatar"
        ? await authApi.updateAvatar({ dataUrl })
        : await authApi.updateBanner({ dataUrl });
    setProfile(updated);
  };

  const handleNicknameClick = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    if (!profile) {
      return;
    }
    const nextValue = window.prompt("请输入新的昵称", profile.nickname);
    if (nextValue === null) {
      return;
    }
    const trimmed = nextValue.trim();
    if (!trimmed) {
      return;
    }
    authApi.updateNickname({ nickname: trimmed }).then(setProfile);
  };

  return (
    <section className="w-full">
      <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-6">
        <div
          className="relative h-[195px] w-full cursor-pointer overflow-hidden rounded-none bg-zinc-200"
          onClick={() => bannerInputRef.current?.click()}
        >
          <div
            className="absolute inset-0 bg-cover bg-center opacity-50"
            style={{ backgroundImage: `url(${bannerUrl})` }}
          />
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute top-[36px] left-1/2 flex -translate-x-1/2 flex-col items-center">
            <div
              className="h-[101px] w-[101px] cursor-pointer overflow-hidden rounded-full border-4 border-white bg-zinc-200 bg-cover bg-center"
              style={{ backgroundImage: `url(${avatarUrl})` }}
              onClick={(event) => {
                event.stopPropagation();
                avatarInputRef.current?.click();
              }}
            />
            <div
              className="mt-2 cursor-pointer text-[24px] text-[#202020]"
              onClick={handleNicknameClick}
            >
              {loading ? "加载中..." : profile?.nickname || "用户"}
            </div>
          </div>
        </div>
        <input
          ref={bannerInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => handleUpload(event, "banner")}
        />
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => handleUpload(event, "avatar")}
        />

        <div className="mt-[40px] flex w-full flex-col items-center gap-2 sm:mt-[55px]">
          <button
            type="button"
            onClick={handleSettings}
            className="w-full bg-white px-6 py-4 text-left text-lg text-[#202020] hover:bg-zinc-50 sm:py-[23px] sm:text-[24px]"
          >
            听写设置
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full bg-white px-6 py-4 text-left text-lg text-[#202020] hover:bg-zinc-50 sm:py-[23px] sm:text-[24px]"
          >
            退出登录
          </button>
          <button
            type="button"
            onClick={handleDeactivate}
            className="w-full bg-white px-6 py-4 text-left text-lg text-[#202020] hover:bg-zinc-50 sm:py-[23px] sm:text-[24px]"
          >
            注销账户
          </button>
          <button
            type="button"
            onClick={handleFeedback}
            className="w-full bg-white px-6 py-4 text-left text-lg text-[#202020] hover:bg-zinc-50 sm:py-[23px] sm:text-[24px]"
          >
            反馈中心
          </button>
        </div>
      </div>
      {logoutOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div
            className="w-full max-w-[360px] rounded-[12px] bg-white p-6 shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="text-[18px] font-medium text-[#202020]">确认退出登录？</div>
            <div className="mt-2 text-sm text-zinc-600">
              退出后需要重新登录才能继续使用。
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setLogoutOpen(false)}
                className="rounded-[6px] border border-zinc-200 px-4 py-2 text-sm text-[#202020] hover:bg-zinc-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="rounded-[6px] bg-[#007AFF] px-4 py-2 text-sm text-white hover:bg-[#0A84FF]"
              >
                确认退出
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {deactivateOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div
            className="w-full max-w-[360px] rounded-[12px] bg-white p-6 shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="text-[18px] font-medium text-[#202020]">
              确认注销账号？
            </div>
            <div className="mt-2 text-sm text-zinc-600">
              注销后账号与数据将被删除，无法恢复。
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeactivateOpen(false)}
                className="rounded-[6px] border border-zinc-200 px-4 py-2 text-sm text-[#202020] hover:bg-zinc-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={confirmDeactivate}
                className="rounded-[6px] bg-[#007AFF] px-4 py-2 text-sm text-white hover:bg-[#0A84FF]"
              >
                确认注销
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {settingsOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
          onClick={() => setSettingsOpen(false)}
        >
          <div
            className="w-full max-w-[560px] rounded-[10px] border border-[#E5E5E5] bg-white shadow-[0px_0px_15px_0px_rgba(0,0,0,0.05)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 pt-5">
              <div className="w-6" />
              <div className="text-[20px] leading-[29px] tracking-[-0.6px] text-[#202020]">
                设置
              </div>
              <button
                type="button"
                className="h-6 w-6 text-[20px] leading-6 text-[#202020]"
                onClick={() => setSettingsOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="px-6 pb-6 pt-6">
              <div className="flex items-center gap-4">
                <div className="text-[20px] leading-[29px] tracking-[-0.6px] text-[#202020]">
                  播放倍速
                </div>
                <div className="h-[2px] flex-1 bg-[#E5E5E5]" />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {speedOptions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    disabled={settingsLoading}
                    onClick={() => setSpeed(item)}
                    className={`rounded-full border px-4 py-2 text-sm ${
                      speed === item
                        ? "border-[#2F6BFF] bg-[#E8F0FF] text-[#2F6BFF]"
                        : "border-zinc-200 text-zinc-600"
                    }`}
                  >
                    {item}x
                  </button>
                ))}
              </div>

              <div className="mt-6 flex items-center gap-4">
                <div className="text-[20px] leading-[29px] tracking-[-0.6px] text-[#202020]">
                  播放遍数
                </div>
                <div className="h-[2px] flex-1 bg-[#E5E5E5]" />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {repeatOptions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    disabled={settingsLoading}
                    onClick={() => setRepeat(item)}
                    className={`rounded-full border px-4 py-2 text-sm ${
                      repeat === item
                        ? "border-[#2F6BFF] bg-[#E8F0FF] text-[#2F6BFF]"
                        : "border-zinc-200 text-zinc-600"
                    }`}
                  >
                    {item}遍
                  </button>
                ))}
              </div>

              {settingsMessage ? (
                <div className="mt-4 text-xs text-zinc-500">
                  {settingsMessage}
                </div>
              ) : null}
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={settingsSaving}
                className="mt-6 w-full rounded-[6px] bg-[#2F6BFF] py-2 text-sm text-white disabled:opacity-60"
              >
                {settingsSaving ? "保存中..." : "保存"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {feedbackOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
          onClick={() => setFeedbackOpen(false)}
        >
          <div
            className="w-full max-w-[560px] rounded-[10px] border border-[#E5E5E5] bg-white shadow-[0px_0px_15px_0px_rgba(0,0,0,0.05)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 pt-5">
              <div className="w-6" />
              <div className="text-[20px] leading-[29px] tracking-[-0.6px] text-[#202020]">
                反馈中心
              </div>
              <button
                type="button"
                className="h-6 w-6 text-[20px] leading-6 text-[#202020]"
                onClick={() => setFeedbackOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="px-6 pb-6 pt-6">
              <div className="text-sm text-zinc-700">问题与建议</div>
              <textarea
                value={feedbackContent}
                onChange={(event) => setFeedbackContent(event.target.value)}
                placeholder="请填写你的反馈内容"
                className="mt-3 h-[140px] w-full rounded-[6px] border border-zinc-200 p-3 text-sm text-zinc-700 outline-none"
              />
              {feedbackMessage ? (
                <div className="mt-3 text-xs text-zinc-500">{feedbackMessage}</div>
              ) : null}
              <button
                type="button"
                onClick={handleSubmitFeedback}
                disabled={feedbackSubmitting}
                className="mt-4 w-full rounded-[6px] bg-[#2F6BFF] py-2 text-sm text-white disabled:opacity-60"
              >
                {feedbackSubmitting ? "提交中..." : "提交反馈"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
