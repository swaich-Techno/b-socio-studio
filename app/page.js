import { ArrowRight, BarChart3, CheckCircle2, Clapperboard, MapPin, ShieldCheck, WalletCards } from "lucide-react";
import Button from "@/components/Button";

const lanes = [
  { title: "Acquire", text: "Find local prospects, score them, track outreach, and convert wins into clients.", icon: MapPin },
  { title: "Produce", text: "Create posts, calendars, reel scripts, evergreen video prompts, and approval-ready work.", icon: Clapperboard },
  { title: "Collect", text: "Monitor invoices, balances, packages, renewals, and payment follow-ups.", icon: WalletCards },
  { title: "Prove", text: "Keep analytics, reports, approvals, team activity, and audit logs connected.", icon: BarChart3 }
];

const deployChecks = [
  "Separate repo ready",
  "Custom domain friendly",
  "Mobile bottom navigation",
  "Lead engine included",
  "Neon migration scaffold"
];

export default function LandingPage() {
  return (
    <div className="bg-[#f6f8fb]">
      <section className="border-b border-slate-200 bg-[#071525] px-4 py-16 text-white md:py-20">
        <div className="page-container">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-teal-100">
              <ShieldCheck size={14} />
              Private growth operating system
            </div>
            <h1 className="mt-6 text-4xl font-black leading-tight md:text-5xl">B Socio Studio</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-200">
              A deployable agency workspace for generating local business leads, managing clients, producing reels and content, tracking money, and keeping owner approvals under control.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="/login" className="gap-2 bg-white text-[#071525] hover:bg-slate-100">
                Open Workspace <ArrowRight size={17} />
              </Button>
              <Button href="/register" variant="secondary">Create Owner Account</Button>
            </div>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {deployChecks.map((item) => (
              <div key={item} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 py-3 text-sm font-semibold text-slate-100">
                <CheckCircle2 size={16} className="text-teal-200" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-12">
        <div className="page-container">
          <div className="grid gap-5 md:grid-cols-4">
            {lanes.map((lane) => {
              const Icon = lane.icon;
              return (
                <article key={lane.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <Icon className="text-accent" size={24} />
                  <h2 className="mt-4 text-lg font-black text-slate-950">{lane.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{lane.text}</p>
                </article>
              );
            })}
          </div>

          <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <p className="text-xs font-bold uppercase text-accent">Deployment path</p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">Use a fresh repository, deploy on Vercel, then attach the domain.</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Keep this app independent from other projects, add production environment variables, verify owner login, then point the chosen subdomain to the new Vercel project.
                </p>
              </div>
              <Button href="/login" variant="secondary">Go to Login</Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
