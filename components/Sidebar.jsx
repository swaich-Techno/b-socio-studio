"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Bell, BookOpen, CalendarDays, CheckCircle2, Clapperboard, FileText, Home, Image, ListChecks, MapPin, Menu, MessageCircle, Search, ShieldCheck, Sparkles, Store, TrendingUp, Users, WalletCards, X } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/components/LanguageSelector";

const navGroups = [
  {
    title: "Command",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: Home },
      { href: "/leads", label: "Lead Engine", icon: MapPin },
      { href: "/search", label: "Search", icon: Search }
    ]
  },
  {
    title: "Sales",
    items: [
      { href: "/clients", label: "Clients", icon: Store },
      { href: "/catalogues", label: "Catalogues", icon: BookOpen },
      { href: "/financials", label: "Financials", icon: WalletCards }
    ]
  },
  {
    title: "Production",
    items: [
      { href: "/content-generator", label: "Generator", icon: Sparkles },
      { href: "/reels", label: "Reels", icon: Clapperboard },
      { href: "/ai-image-studio", label: "Image Studio", icon: Image },
      { href: "/trends", label: "Trends", icon: TrendingUp },
      { href: "/calendar", label: "Calendar", icon: CalendarDays },
      { href: "/tasks", label: "Tasks", icon: ListChecks }
    ]
  },
  {
    title: "Control",
    items: [
      { href: "/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/reports", label: "Reports", icon: FileText },
      { href: "/chat", label: "Chat", icon: MessageCircle },
      { href: "/notifications", label: "Notifications", icon: Bell },
      { href: "/team", label: "Team", icon: Users },
      { href: "/approvals", label: "Approvals", icon: CheckCircle2 },
      { href: "/audit-logs", label: "Audit Logs", icon: ShieldCheck }
    ]
  }
];

const mobileTabs = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/leads", label: "Leads", icon: MapPin },
  { href: "/reels", label: "Reels", icon: Clapperboard },
  { href: "/tasks", label: "Tasks", icon: ListChecks },
  { href: "/chat", label: "Chat", icon: MessageCircle }
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();

  const nav = (
    <nav className="flex flex-col gap-5">
      {navGroups.map((group) => (
        <section key={group.title}>
          <p className="px-3 text-[11px] font-black uppercase text-slate-500">{group.title}</p>
          <div className="mt-2 grid gap-1">
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${active ? "bg-white text-[#071525] shadow-sm" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}
                  title={t(item.label)}
                >
                  <Icon size={18} />
                  <span>{t(item.label)}</span>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </nav>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-40 grid h-12 w-12 place-items-center rounded-lg bg-[#071525] text-white shadow-soft md:hidden"
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>
      <aside className="fixed inset-y-16 left-0 z-30 hidden w-72 overflow-y-auto border-r border-white/10 bg-[#071525] px-4 py-6 md:block">
        <div className="mb-6 rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-bold uppercase text-teal-200">Growth OS</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-white">Lead discovery, client production, finance, and approvals in one workspace.</p>
        </div>
        {nav}
      </aside>
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-slate-200 bg-white/95 px-2 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
        {mobileTabs.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href} className={"grid min-h-14 place-items-center gap-1 rounded-xl px-1 text-[11px] font-bold " + (active ? "bg-accent-soft text-accent-dark" : "text-slate-500")}> 
              <Icon size={19} />
              <span className="truncate">{t(item.label)}</span>
            </Link>
          );
        })}
      </nav>
      {open ? (
        <div className="fixed inset-0 z-50 bg-slate-950/50 md:hidden">
          <aside className="h-full w-[86vw] max-w-sm overflow-y-auto bg-[#071525] p-4 shadow-soft">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-black text-white">B Socio Studio</p>
                <p className="text-xs text-slate-400">Be Seen. Be Social.</p>
              </div>
              <button className="rounded-xl bg-white/10 p-2 text-white" onClick={() => setOpen(false)} aria-label="Close menu">
                <X size={20} />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      ) : null}
    </>
  );
}
