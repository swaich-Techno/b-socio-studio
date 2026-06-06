"use client";

import { useEffect, useMemo, useState } from "react";
import { Clapperboard, Sparkles } from "lucide-react";
import Button from "@/components/Button";
import DashboardCard from "@/components/DashboardCard";
import EmptyState from "@/components/EmptyState";
import Loading from "@/components/Loading";

const statuses = ["Idea", "Script Ready", "Shooting", "Editing", "Review", "Approved", "Posted"];
const activeStatuses = ["Idea", "Script Ready", "Shooting", "Editing", "Review"];

export default function ReelsPage() {
  const [reels, setReels] = useState(null);
  const [filter, setFilter] = useState("All");
  const [message, setMessage] = useState("");

  async function loadReels() {
    const response = await fetch("/api/reels", { cache: "no-store" });
    const data = await response.json();
    setReels(data.reels || []);
  }

  useEffect(() => {
    loadReels();
  }, []);

  async function createVideo(reel) {
    const response = await fetch("/api/reels/create-video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reelId: reel._id })
    });
    const result = await response.json();
    setMessage(response.ok ? "Video job sent to provider." : result.error || "Could not start video job.");
    loadReels();
  }

  async function updateStatus(reel, status) {
    const response = await fetch(`/api/reels/${reel._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    const result = await response.json();
    setMessage(response.ok ? "Reel status updated." : result.error || "Could not update reel.");
    loadReels();
  }

  const stats = useMemo(() => ({
    total: (reels || []).length,
    active: (reels || []).filter((reel) => activeStatuses.includes(reel.status)).length,
    editing: (reels || []).filter((reel) => ["Editing", "Review"].includes(reel.status)).length,
    posted: (reels || []).filter((reel) => reel.status === "Posted").length
  }), [reels]);

  if (!reels) return <Loading label="Loading reels..." />;

  const filtered = filter === "All" ? reels : reels.filter((reel) => reel.status === filter);

  return (
    <div className="page-container">
      <div className="rounded-lg bg-[#071525] p-6 text-white shadow-sm md:p-8">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-bold uppercase text-teal-200">Reel production</p>
            <h1 className="mt-3 text-3xl font-black md:text-4xl">Reels</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">Track scripts, shooting, editing, review, approvals, posted work, and video-provider jobs from one production board.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button href="/reel-studio" className="gap-2 bg-white text-[#071525] hover:bg-slate-100"><Sparkles size={16} />Create Script</Button>
            <Button href="/calendar" variant="secondary" className="gap-2"><Clapperboard size={16} />Schedule</Button>
          </div>
        </div>
      </div>

      {message ? <p className="mt-5 rounded-lg bg-accent-soft p-3 text-sm font-semibold text-accent-dark">{message}</p> : null}

      <div className="mt-8 grid gap-5 md:grid-cols-4">
        <DashboardCard label="Total reels" value={stats.total} />
        <DashboardCard label="Active pipeline" value={stats.active} />
        <DashboardCard label="Editing / review" value={stats.editing} />
        <DashboardCard label="Posted" value={stats.posted} />
      </div>

      <section className="mt-6 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center">
        <span className="text-sm font-bold text-slate-700">Filter</span>
        <select value={filter} onChange={(event) => setFilter(event.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-4 focus:ring-accent-soft">
          <option>All</option>
          {statuses.map((status) => <option key={status}>{status}</option>)}
        </select>
      </section>

      <section className="mt-8 grid gap-5 xl:grid-cols-2">
        {filtered.length ? filtered.map((reel) => (
          <article key={reel._id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">{reel.status}</p>
                <h2 className="mt-2 text-xl font-black text-slate-950">{reel.productName || "Reel idea"}</h2>
                <p className="mt-1 text-sm text-slate-500">{reel.clientId?.businessName || "Client"} - {reel.goal || "Goal"} - {reel.duration || "Duration"}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{reel.assignedTo || "Unassigned"}</span>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">{reel.hook || reel.script || "No hook saved yet."}</p>
            <div className="mt-4 grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <p><span className="font-bold text-slate-900">Caption:</span> {reel.caption || "Not added"}</p>
              <p><span className="font-bold text-slate-900">Cover:</span> {reel.coverPrompt || "Not added"}</p>
              <p><span className="font-bold text-slate-900">Video:</span> {reel.videoStatus || "Not Requested"}{reel.videoJobId ? " - Job " + reel.videoJobId : ""}</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => createVideo(reel)}>Create Video Job</Button>
              {reel.videoUrl ? <Button href={reel.videoUrl} target="_blank" variant="secondary">Open Video</Button> : null}
              {statuses.map((status) => (
                <Button key={status} variant={status === reel.status ? "primary" : "ghost"} onClick={() => updateStatus(reel, status)}>{status}</Button>
              ))}
            </div>
          </article>
        )) : (
          <div className="xl:col-span-2">
            <EmptyState title="No reels found" message="Create your first reel script and it will appear in this production pipeline." actionHref="/reel-studio" actionLabel="Create Reel Script" />
          </div>
        )}
      </section>
    </div>
  );
}
