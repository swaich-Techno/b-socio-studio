"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Clock, MapPin, Sparkles, Users, WalletCards } from "lucide-react";
import Button from "@/components/Button";
import DashboardCard from "@/components/DashboardCard";
import EmptyState from "@/components/EmptyState";
import Loading from "@/components/Loading";

const onboardingSteps = [
  ["hasClients", "Add your first client"],
  ["hasTeam", "Approve or add your team"],
  ["hasContent", "Schedule first content"],
  ["hasAnalytics", "Add first analytics record"],
  ["hasLeadPipeline", "Add a lead in client pipeline"]
];

function formatMoney(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
}

function formatDate(value) {
  if (!value) return "No date";
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [range, setRange] = useState("week");
  const [assignedTo, setAssignedTo] = useState("");

  useEffect(() => {
    const params = new URLSearchParams({ range });
    if (assignedTo) params.set("assignedTo", assignedTo);
    fetch(`/api/dashboard?${params}`).then((res) => res.json()).then(setData);
  }, [range, assignedTo]);

  const teamNames = useMemo(() => data?.teamWorkload?.map((member) => member.name) || [], [data]);

  if (!data) return <Loading label="Loading command center..." />;

  const incompleteSteps = onboardingSteps.filter(([key]) => !data.onboarding?.[key]);
  const upcoming = data.upcoming || [];
  const renewals = data.upcomingRenewals || [];
  const team = data.teamWorkload || [];
  const analytics = data.recentAnalytics || [];

  return (
    <div className="page-container">
      <section className="rounded-lg bg-[#071525] p-6 text-white shadow-sm md:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase text-teal-200">Owner command center</p>
            <h1 className="mt-3 text-3xl font-black md:text-4xl">Run acquisition, production, and collections from one desk.</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
              Watch leads, active clients, approvals, money, and team workload before work slips or revenue gets delayed.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button href="/leads" className="gap-2 bg-white text-[#071525] hover:bg-slate-100">
              Find Leads <MapPin size={16} />
            </Button>
            <Button href="/reel-studio" variant="secondary" className="gap-2">
              Make Reel <Sparkles size={16} />
            </Button>
          </div>
        </div>
      </section>

      <section className="mt-5 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center">
        <span className="text-sm font-bold text-slate-700">Focus</span>
        <select value={range} onChange={(event) => setRange(event.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-4 focus:ring-accent-soft">
          <option value="week">This week</option>
          <option value="month">This month</option>
        </select>
        <select value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-4 focus:ring-accent-soft">
          <option value="">All team members</option>
          {teamNames.map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
        <div className="ml-0 flex flex-wrap gap-2 md:ml-auto">
          <Button href="/financials" variant="secondary" className="gap-2"><WalletCards size={16} /> Money</Button>
          <Button href="/team" variant="secondary" className="gap-2"><Users size={16} /> Team</Button>
        </div>
      </section>

      {incompleteSteps.length ? (
        <section className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-5">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div>
              <h2 className="font-black text-amber-950">Setup checklist</h2>
              <p className="mt-1 text-sm text-amber-800">Complete these once so the workspace is ready for live operations.</p>
            </div>
            <span className="text-sm font-bold text-amber-900">{onboardingSteps.length - incompleteSteps.length}/{onboardingSteps.length} done</span>
          </div>
          <div className="mt-4 grid gap-2 md:grid-cols-5">
            {onboardingSteps.map(([key, label]) => (
              <div key={key} className={`flex items-center gap-2 rounded-lg p-3 text-sm font-semibold ${data.onboarding?.[key] ? "bg-white text-emerald-700" : "bg-amber-100 text-amber-900"}`}>
                <CheckCircle2 size={16} />
                {label}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <DashboardCard label="Clients" value={data.stats.totalClients} helper={`${data.stats.activeClients} active`} />
        <DashboardCard label="Approvals" value={data.stats.pendingApprovals} helper="Needs review" />
        <DashboardCard label="Revenue" value={formatMoney(data.stats.thisMonthRevenue)} helper="Collected this month" />
        <DashboardCard label="Outstanding" value={formatMoney(data.stats.outstandingBalance)} helper="Invoices and balances" />
        <DashboardCard label="Reels" value={data.stats.reelsInEditing} helper="Editing or review" />
        <DashboardCard label="Tasks" value={data.stats.pendingTasks} helper={assignedTo || "Open work"} />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase text-accent">Production queue</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">Upcoming scheduled content</h2>
            </div>
            <Button href="/calendar" variant="ghost" className="gap-2">Calendar <ArrowRight size={15} /></Button>
          </div>
          <div className="mt-4 grid gap-3">
            {upcoming.length ? upcoming.map((item) => (
              <div key={item._id} className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-900">{item.topic}</p>
                    <p className="mt-1 text-slate-500">{item.clientId?.businessName || "Client"} - {item.platform}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600">{formatDate(item.postDate || item.date)}</span>
                </div>
              </div>
            )) : <EmptyState title="No upcoming content" message="Add content plans to see the next scheduled work here." actionHref="/calendar" actionLabel="Open Calendar" />}
          </div>
        </section>

        <section className="card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase text-accent">Payment watch</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">Renewals</h2>
            </div>
            <Button href="/financials" variant="ghost" className="gap-2">Finance <ArrowRight size={15} /></Button>
          </div>
          <div className="mt-4 grid gap-3">
            {renewals.length ? renewals.map((client) => (
              <a key={client._id} href={`/clients/${client._id}`} className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm hover:bg-white">
                <p className="font-bold text-slate-900">{client.businessName}</p>
                <p className="mt-1 flex items-center gap-2 text-slate-500"><Clock size={15} />Renewal: {formatDate(client.renewalDate)}</p>
              </a>
            )) : <EmptyState title="No renewals due" message="Clients with upcoming renewal dates will appear here." />}
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="text-xl font-black text-slate-950">Team workload</h2>
          <div className="mt-4 grid gap-3">
            {team.length ? team.map((member) => (
              <div key={member.name} className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
                <p className="font-bold text-slate-900">{member.name}</p>
                <p className="mt-1 text-slate-500">{member.role} - {member.assignedClients} assigned clients</p>
              </div>
            )) : <EmptyState title="No team members" message="Add your team to see workload here." actionHref="/team/new" actionLabel="Add Team" />}
          </div>
        </section>

        <section className="card p-5">
          <h2 className="text-xl font-black text-slate-950">Recent analytics</h2>
          <div className="mt-4 grid gap-3">
            {analytics.length ? analytics.map((item) => (
              <div key={item._id} className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
                <p className="font-bold text-slate-900">{item.clientId?.businessName || "Client"} - {item.platform}</p>
                <p className="mt-1 text-slate-500">Reach {item.reach} - Leads {item.leads} - {formatDate(item.date)}</p>
              </div>
            )) : <EmptyState title="No analytics yet" message="Add manual performance records to see recent analytics." actionHref="/analytics" actionLabel="Add Analytics" />}
          </div>
        </section>
      </div>
    </div>
  );
}
