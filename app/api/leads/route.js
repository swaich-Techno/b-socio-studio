import { NextResponse } from "next/server";
import { hasPermission, isOwnerAdmin, requireApiUser } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import Lead from "@/models/Lead";

function canManageLeads(user) {
  return isOwnerAdmin(user) || hasPermission(user, "manage_clients");
}

function normalizeLead(body, user) {
  return {
    agencyName: user.agencyName,
    userId: user._id,
    source: body.source || "manual",
    placeId: body.placeId || "",
    businessName: body.businessName || body.name || "Unnamed business",
    industry: body.industry || body.category || "",
    category: body.category || "",
    location: body.location || body.address || "",
    address: body.address || body.location || "",
    phone: body.phone || "",
    website: body.website || "",
    googleMapsUri: body.googleMapsUri || "",
    rating: Number(body.rating || 0),
    reviewCount: Number(body.reviewCount || 0),
    latitude: body.latitude === undefined ? undefined : Number(body.latitude),
    longitude: body.longitude === undefined ? undefined : Number(body.longitude),
    score: Number(body.score || 0),
    status: body.status || "New",
    priority: body.priority || "Medium",
    ownerNotes: body.ownerNotes || "",
    nextAction: body.nextAction || "Call or WhatsApp with audit offer",
    dataExpiresAt: body.dataExpiresAt ? new Date(body.dataExpiresAt) : undefined,
    searchQuery: body.searchQuery || ""
  };
}

export async function GET(request) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;
  if (!canManageLeads(auth.user)) {
    return NextResponse.json({ error: "You do not have permission to view leads." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const query = { agencyName: auth.user.agencyName };
  if (searchParams.get("status") && searchParams.get("status") !== "All") query.status = searchParams.get("status");
  if (searchParams.get("source") && searchParams.get("source") !== "All") query.source = searchParams.get("source");

  const leads = await Lead.find(query).populate("clientId", "businessName status").sort({ score: -1, createdAt: -1 }).lean();
  return NextResponse.json({ leads });
}

export async function POST(request) {
  try {
    const auth = await requireApiUser(request);
    if (auth.error) return auth.error;
    if (!canManageLeads(auth.user)) {
      return NextResponse.json({ error: "You do not have permission to save leads." }, { status: 403 });
    }
    const body = await request.json();
    if (!body.businessName && !body.name) {
      return NextResponse.json({ error: "Business name is required." }, { status: 400 });
    }
    const normalized = normalizeLead(body, auth.user);
    const lead = normalized.placeId
      ? await Lead.findOneAndUpdate(
          { agencyName: auth.user.agencyName, placeId: normalized.placeId },
          { $set: normalized },
          { new: true, upsert: true, runValidators: true }
        )
      : await Lead.create(normalized);

    await createAuditLog({ request, user: auth.user, action: "lead_saved", entityType: "Lead", entityId: lead._id, details: { businessName: lead.businessName, source: lead.source } });
    return NextResponse.json({ lead }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Lead save failed." }, { status: 500 });
  }
}
