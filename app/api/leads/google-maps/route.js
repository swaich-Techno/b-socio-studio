import { NextResponse } from "next/server";
import { hasPermission, isOwnerAdmin, requireApiUser } from "@/lib/auth";
import { searchGooglePlaces } from "@/lib/googlePlaces";

function canManageLeads(user) {
  return isOwnerAdmin(user) || hasPermission(user, "manage_clients");
}

export async function POST(request) {
  try {
    const auth = await requireApiUser(request);
    if (auth.error) return auth.error;
    if (!canManageLeads(auth.user)) {
      return NextResponse.json({ error: "You do not have permission to discover leads." }, { status: 403 });
    }
    const body = await request.json();
    const result = await searchGooglePlaces(body);
    return NextResponse.json(result, { status: result.configured === false ? 400 : 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Lead discovery failed." }, { status: 500 });
  }
}
