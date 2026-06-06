import { NextResponse } from "next/server";
import { hasPermission, isOwnerAdmin, requireApiUser } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import Client from "@/models/Client";
import Lead from "@/models/Lead";

function canManageLeads(user) {
  return isOwnerAdmin(user) || hasPermission(user, "manage_clients");
}

export async function POST(request, context) {
  try {
    const auth = await requireApiUser(request);
    if (auth.error) return auth.error;
    if (!canManageLeads(auth.user)) return NextResponse.json({ error: "You do not have permission to convert leads." }, { status: 403 });
    const { id } = await context.params;
    const lead = await Lead.findOne({ _id: id, agencyName: auth.user.agencyName });
    if (!lead) return NextResponse.json({ error: "Lead not found." }, { status: 404 });
    if (lead.clientId) return NextResponse.json({ error: "Lead is already converted." }, { status: 409 });

    const client = await Client.create({
      userId: auth.user._id,
      agencyName: auth.user.agencyName,
      businessName: lead.businessName,
      industry: lead.industry || lead.category || "Local Business",
      location: lead.location || lead.address || "",
      contactPerson: "",
      phone: lead.phone || "",
      email: "",
      instagramHandle: "",
      facebookPage: "",
      whatsappNumber: lead.phone || "",
      targetAudience: "Local customers",
      mainProducts: "",
      pipelineStatus: "Lead",
      status: "Lead",
      notes: [lead.ownerNotes, lead.googleMapsUri ? "Google Maps: " + lead.googleMapsUri : ""].filter(Boolean).join("\n")
    });

    lead.clientId = client._id;
    lead.status = "Won";
    lead.nextAction = "Onboard client and prepare proposal";
    await lead.save();

    await createAuditLog({ request, user: auth.user, action: "lead_converted", entityType: "Lead", entityId: lead._id, details: { businessName: lead.businessName, clientId: client._id } });
    return NextResponse.json({ lead, client }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Lead conversion failed." }, { status: 500 });
  }
}
