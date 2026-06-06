"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, MapPin, Phone, RefreshCw, Star, Target } from "lucide-react";
import Button from "@/components/Button";
import DashboardCard from "@/components/DashboardCard";
import EmptyState from "@/components/EmptyState";
import FormInput from "@/components/FormInput";
import Loading from "@/components/Loading";

const statuses = ["New", "Shortlisted", "Contacted", "Follow-up", "Proposal Sent", "Won", "Lost"];
const priorities = ["Low", "Medium", "High"];

function leadScoreTone(score) {
  if (score >= 75) return "bg-emerald-50 text-emerald-700";
  if (score >= 50) return "bg-amber-50 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

export default function LeadsPage() {
  const [leads, setLeads] = useState(null);
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState("");
  const [searching, setSearching] = useState(false);

  async function loadLeads() {
    const response = await fetch("/api/leads", { cache: "no-store" });
    const data = await response.json();
    setLeads(data.leads || []);
    if (!response.ok) setMessage(data.error || "Could not load leads.");
  }

  useEffect(() => {
    loadLeads();
  }, []);

  async function searchGoogleMaps(event) {
    event.preventDefault();
    setSearching(true);
    setMessage("");
    const body = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch("/api/leads/google-maps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    setResults(data.results || []);
    setMessage(data.message || data.attribution || (response.ok ? "Google Maps leads loaded." : "Google Maps search failed."));
    setSearching(false);
  }

  async function saveLead(lead) {
    const response = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lead)
    });
    const data = await response.json();
    setMessage(response.ok ? "Lead saved to pipeline." : data.error || "Lead could not be saved.");
    loadLeads();
  }

  async function updateLead(id, patch) {
    const response = await fetch("/api/leads/" + id, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch)
    });
    const data = await response.json();
    setMessage(response.ok ? "Lead updated." : data.error || "Lead update failed.");
    loadLeads();
  }

  async function convertLead(id) {
    const response = await fetch("/api/leads/" + id + "/convert", { method: "POST" });
    const data = await response.json();
    setMessage(response.ok ? "Lead converted to client." : data.error || "Lead conversion failed.");
    loadLeads();
  }

  const stats = useMemo(() => {
    const list = leads || [];
    return {
      total: list.length,
      hot: list.filter((lead) => Number(lead.score || 0) >= 75).length,
      contacted: list.filter((lead) => ["Contacted", "Follow-up", "Proposal Sent"].includes(lead.status)).length,
      won: list.filter((lead) => lead.status === "Won").length
    };
  }, [leads]);

  if (!leads) return <Loading label="Loading lead pipeline..." />;

  return (
    <div className="page-container">
      <div className="rounded-lg bg-[#071525] p-6 text-white shadow-sm md:p-8">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-bold uppercase text-teal-200">Lead discovery</p>
            <h1 className="mt-3 text-3xl font-black md:text-4xl">Google Maps Lead Engine</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">Find local businesses by area and industry, save the best opportunities, track outreach, and convert qualified leads into clients.</p>
          </div>
          <Button href="/clients/new" className="bg-white text-[#071525] hover:bg-slate-100">Add Manual Client</Button>
        </div>
      </div>

      {message ? <p className="mt-5 rounded-lg bg-accent-soft p-3 text-sm font-semibold text-accent-dark">{message}</p> : null}

      <div className="mt-8 grid gap-5 md:grid-cols-4">
        <DashboardCard label="Saved leads" value={stats.total} />
        <DashboardCard label="Hot leads" value={stats.hot} />
        <DashboardCard label="In outreach" value={stats.contacted} />
        <DashboardCard label="Converted" value={stats.won} />
      </div>

      <form onSubmit={searchGoogleMaps} className="mt-6 grid gap-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-4">
        <FormInput label="Keyword" name="keyword" placeholder="social media, instagram, website" />
        <FormInput label="Industry" name="industry" placeholder="sweet shop, salon, gym" required />
        <FormInput label="Location" name="location" placeholder="Ludhiana, Samrala, Chandigarh" required />
        <FormInput label="Results" name="pageSize" type="number" min="5" max="20" defaultValue="12" />
        <div className="md:col-span-4">
          <Button type="submit" disabled={searching} className="gap-2">
            {searching ? <RefreshCw size={16} className="animate-spin" /> : <Target size={16} />}
            {searching ? "Searching..." : "Search Google Maps"}
          </Button>
        </div>
      </form>

      {results.length ? (
        <section className="mt-8">
          <h2 className="text-xl font-black text-slate-950">Discovery results</h2>
          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            {results.map((lead) => (
              <article key={lead.placeId || lead.businessName} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black text-slate-950">{lead.businessName}</h3>
                    <p className="mt-1 text-sm text-slate-500">{lead.category || "Local business"}</p>
                  </div>
                  <span className={"rounded-full px-3 py-1 text-xs font-bold " + leadScoreTone(lead.score)}>Score {lead.score}</span>
                </div>
                <div className="mt-4 grid gap-2 text-sm text-slate-600">
                  <p className="flex gap-2"><MapPin size={16} />{lead.address || "No address"}</p>
                  <p className="flex gap-2"><Phone size={16} />{lead.phone || "No phone in search result"}</p>
                  <p className="flex gap-2"><Star size={16} />{lead.rating || 0} rating, {lead.reviewCount || 0} reviews</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button onClick={() => saveLead(lead)}>Save Lead</Button>
                  {lead.googleMapsUri ? <Button href={lead.googleMapsUri} target="_blank" variant="secondary" className="gap-2">Open Maps <ExternalLink size={15} /></Button> : null}
                  {lead.website ? <Button href={lead.website} target="_blank" variant="ghost">Website</Button> : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-8">
        <h2 className="text-xl font-black text-slate-950">Saved pipeline</h2>
        <div className="mt-4 grid gap-4">
          {leads.length ? leads.map((lead) => (
              <article key={lead._id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-black text-slate-950">{lead.businessName}</h3>
                    <span className={"rounded-full px-3 py-1 text-xs font-bold " + leadScoreTone(lead.score)}>Score {lead.score || 0}</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{lead.status}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{lead.industry || lead.category || "Local Business"} - {lead.location || lead.address || "No location"}</p>
                  <p className="mt-2 text-sm text-slate-600">Next: {lead.nextAction || "Call or WhatsApp with audit offer"}</p>
                </div>
                <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[520px]">
                  <select value={lead.status} onChange={(event) => updateLead(lead._id, { status: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
                    {statuses.map((status) => <option key={status}>{status}</option>)}
                  </select>
                  <select value={lead.priority || "Medium"} onChange={(event) => updateLead(lead._id, { priority: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
                    {priorities.map((priority) => <option key={priority}>{priority}</option>)}
                  </select>
                  <Button onClick={() => updateLead(lead._id, { status: "Contacted", markContacted: true })} variant="secondary">Mark Contacted</Button>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {lead.phone ? <Button href={"tel:" + lead.phone} variant="ghost">Call</Button> : null}
                {lead.phone ? <Button href={"https://wa.me/" + lead.phone.replace(/[^0-9]/g, "")} target="_blank" variant="ghost">WhatsApp</Button> : null}
                {lead.googleMapsUri ? <Button href={lead.googleMapsUri} target="_blank" variant="ghost">Maps</Button> : null}
                {lead.website ? <Button href={lead.website} target="_blank" variant="ghost">Website</Button> : null}
                {!lead.clientId ? <Button onClick={() => convertLead(lead._id)}>Convert to Client</Button> : <Button href={"/clients/" + lead.clientId._id} variant="secondary">Open Client</Button>}
              </div>
            </article>
          )) : <EmptyState title="No saved leads" message="Search Google Maps or add manual leads to build your sales pipeline." />}
        </div>
      </section>
    </div>
  );
}
