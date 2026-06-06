import { NextResponse } from "next/server";
import { hasPermission, isOwnerAdmin, requireApiUser } from "@/lib/auth";
import Lead from "@/models/Lead";

function canManageLeads(user) {
  return isOwnerAdmin(user) || hasPermission(user, "manage_clients");
}

export async function PUT(request, context) {
  try {
    const auth = await requireApiUser(request);
    if (auth.error) return auth.error;
    if (!canManageLeads(auth.user)) return NextResponse.json({ error: "You do not have permission to update leads." }, { status: 403 });
    const { id } = await context.params;
    const body = await request.json();
    const update = {
      status: body.status,
      priority: body.priority,
      ownerNotes: body.ownerNotes,
      nextAction: body.nextAction,
      lastContactedAt: body.markContacted ? new Date() : body.lastContactedAt ? new Date(body.lastContactedAt) : undefined
    };
    Object.keys(update).forEach((key) => update[key] === undefined && delete update[key]);
    const lead = await Lead.findOneAndUpdate({ _id: id, agencyName: auth.user.agencyName }, update, { new: true, runValidators: true });
    if (!lead) return NextResponse.json({ error: "Lead not found." }, { status: 404 });
    return NextResponse.json({ lead });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Lead update failed." }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;
  if (!isOwnerAdmin(auth.user)) return NextResponse.json({ error: "Only Owner/Admin can delete leads." }, { status: 403 });
  const { id } = await context.params;
  const lead = await Lead.findOneAndDelete({ _id: id, agencyName: auth.user.agencyName });
  if (!lead) return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  return NextResponse.json({ success: true });
}
