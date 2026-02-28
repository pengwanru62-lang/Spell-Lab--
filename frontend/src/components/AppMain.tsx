"use client";

import { usePathname } from "next/navigation";
import type { PropsWithChildren } from "react";

export function AppMain({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const isLogin = pathname.startsWith("/login");
  const isRegister = pathname.startsWith("/register");
  const isAuth = isLogin || isRegister;
  const isDictation = pathname.startsWith("/dictation");
  const isWordbooks = pathname.startsWith("/wordbooks");
  return (
    <main
      className={
        isAuth
          ? "min-h-screen w-full bg-gradient-to-br from-white via-slate-50 to-sky-50 px-4 sm:px-6"
          : isDictation || isWordbooks
          ? "w-full px-4 sm:px-6"
          : "mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8"
      }
    >
      {children}
    </main>
  );
}
