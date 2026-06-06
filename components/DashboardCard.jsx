export default function DashboardCard({ label, value, helper }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      <div className="mt-3 text-3xl font-black text-slate-950">{value}</div>
      {helper ? <p className="mt-2 text-sm leading-5 text-slate-500">{helper}</p> : null}
    </div>
  );
}
