"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, ShieldCheck } from "lucide-react";
import Button from "@/components/Button";
import LanguageSelector, { useLanguage } from "@/components/LanguageSelector";

export default function Navbar({ isPublic }) {
  const router = useRouter();
  const { t } = useLanguage();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-8">
        <Link href={isPublic ? "/" : "/dashboard"} className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#071525] text-sm font-black text-white">BS</span>
          <span>
            <span className="block text-sm font-black text-slate-950">B Socio Studio</span>
            <span className="block text-xs text-slate-500">Be Seen. Be Social.</span>
          </span>
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-2">
          {!isPublic ? (
            <span className="hidden items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 md:inline-flex">
              <ShieldCheck size={14} />
              Private workspace
            </span>
          ) : null}
          <LanguageSelector />
          {isPublic ? (
            <>
              <Button href="/login" variant="ghost">Login</Button>
              <Button href="/register">Register</Button>
            </>
          ) : (
            <Button variant="secondary" onClick={logout} className="gap-2">
              <LogOut size={16} />
              {t("Logout")}
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
