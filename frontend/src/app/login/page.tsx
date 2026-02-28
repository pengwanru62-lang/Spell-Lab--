"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/services/api/auth";
import { useWindowScale } from "@/hooks/useWindowScale";
import styles from "./login.module.scss";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scale = useWindowScale();

  const handleLogin = async () => {
    if (!email || !password) {
      setError("请输入账号和密码");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await authApi.login({ email, password });
      const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24;
      document.cookie = `token=${res.token}; path=/; max-age=${maxAge}`;
      router.push("/dictation");
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleLogin();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center overflow-hidden bg-[#F8F8F8]">
      <div className={styles.section}>
        <div
          className={styles.desktopWrap}
          style={{ width: "100%", height: "100%" }}
        >
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
              <p className={styles.text}>欢迎登录</p>
              <p className={styles.spellLab}>Spell Lab</p>
              <div className={styles.text4}>
                <span className={styles.text2}>没有账号？</span>
                <Link
                  href="/register"
                  className={styles.text3}
                  onClick={() => router.push("/register")}
                >
                  注册新账号
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
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent text-base text-[#666666] outline-none placeholder:text-[#999999]"
                  placeholder="请输入你的密码"
                />
              </div>
              {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
              <button
                type="button"
                onClick={handleLogin}
                disabled={loading}
                className={styles.rectangle41522}
              >
                <p className={styles.text6}>
                  {loading ? "登录中..." : "登录"}
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
