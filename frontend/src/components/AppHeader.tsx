"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppHeader() {
  const pathname = usePathname();
  if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
    return null;
  }

  const navItems = [
    { label: "听写", href: "/dictation" },
    { label: "词书", href: "/wordbooks" },
    { label: "错词本", href: "/wrongbook" },
    { label: "训练记录", href: "/records" },
    { label: "我的", href: "/profile" },
  ];

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-[80px] w-full max-w-[1440px] items-center px-9">
        <div className="text-[24px] font-black leading-[29px] tracking-[-0.72px] text-[#202020]">
          <span className="block">Spell Lab</span>
          <span className="block">拼写实验室</span>
        </div>
        <nav className="ml-12 flex items-center gap-8 text-[20px] leading-[22px] tracking-[-0.6px] text-[#202020]">
          {navItems.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <div key={item.href} className="relative">
                <Link
                  href={item.href}
                  className={active ? "text-zinc-900" : "text-zinc-700"}
                >
                  {item.label}
                </Link>
                {active ? (
                  <span className="absolute left-1/2 top-[28px] h-1 w-6 -translate-x-1/2 rounded-full bg-[#709EDD]" />
                ) : null}
              </div>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
