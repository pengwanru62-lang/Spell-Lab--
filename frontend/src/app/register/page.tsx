"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/services/api/auth";
import { useWindowScale } from "@/hooks/useWindowScale";
import styles from "../login/login.module.scss";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const scale = useWindowScale();

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }
    const timer = window.setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => {
      window.clearInterval(timer);
    };
  }, [cooldown]);

  const handleSendCode = async () => {
    if (!email) {
      setError("请输入邮箱");
      return;
    }
    setError("");
    setMessage("");
    setSendingCode(true);
    try {
      await authApi.sendRegisterCode({ email });
      setCooldown(60);
      setMessage("验证码已发送");
    } catch (err) {
      setError(err instanceof Error ? err.message : "验证码发送失败");
    } finally {
      setSendingCode(false);
    }
  };

  const handleRegister = async () => {
    if (!email || !password || !code) {
      setError("请填写邮箱、验证码与密码");
      return;
    }
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await authApi.register({
        email,
        password,
        nickname: nickname.trim() ? nickname.trim() : undefined,
        code,
      });
      document.cookie = `token=${res.token}; path=/; max-age=${60 * 60 * 24 * 30}`;
      router.push("/dictation");
    } catch (err) {
      setError(err instanceof Error ? err.message : "注册失败");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRegister();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center overflow-hidden bg-[#F8F8F8]">
      <div className={styles.section}>
        <div className={styles.desktopWrap} style={{ width: "100%", height: "100%" }}>
          <div
            className={styles.desktop}
            style={{ transform: `translate(-50%, -50%) scale(${scale})` }}
          >
            <div className={styles.backgroundScene}>
              <div className={styles.backgroundPolygon} />
              <div className={styles.backgroundCards}>
                <div className={styles.backgroundCardPrimary} />
                <div className={styles.backgroundCardSecondary} />
                <div className={styles.backgroundCardTertiary} />
              </div>
              <div className={styles.backgroundLetter}>A</div>
              <div className={styles.backgroundIcon}>
                <div className={styles.backgroundIconInner}>S</div>
              </div>
            </div>
            <div className={styles.frame84}>
              <div className={styles.group78}>
                <p className={styles.text}>欢迎注册</p>
                <p className={styles.spellLab}>Spell Lab</p>
                <div className={styles.text4}>
                  <span className={styles.text2}>已有账号？</span>
                  <Link href="/login" className={styles.text3}>
                    去登录
                  </Link>
                </div>
              </div>
              <div className={styles.group83}>
                <div className={styles.rectangle4150}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-transparent text-base text-[#666666] outline-none placeholder:text-[#999999]"
                    placeholder="请输入你的邮箱"
                  />
                </div>
                <div className={styles.rectangle4151}>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-transparent text-base text-[#666666] outline-none placeholder:text-[#999999]"
                    placeholder="请输入验证码"
                  />
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={sendingCode || cooldown > 0}
                    className="ml-auto rounded-md border border-[#007AFF] px-3 py-2 text-sm text-[#007AFF] disabled:opacity-50"
                  >
                    {cooldown > 0 ? `${cooldown}s` : "发送验证码"}
                  </button>
                </div>
                <div className={styles.rectangle4151}>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-transparent text-base text-[#666666] outline-none placeholder:text-[#999999]"
                    placeholder="请输入你的密码"
                  />
                </div>
                <div className={styles.rectangle4151}>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-transparent text-base text-[#666666] outline-none placeholder:text-[#999999]"
                    placeholder="请输入昵称（可选）"
                  />
                </div>
                {message && <p className="mt-2 text-sm text-green-600">{message}</p>}
                {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
                <button
                  onClick={handleRegister}
                  disabled={loading}
                  className={styles.rectangle41522}
                >
                  <p className={styles.text6}>
                    {loading ? "注册中..." : "注册"}
                  </p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
