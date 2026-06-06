import { NextResponse } from "next/server";
import { accessibleClientIds } from "@/lib/access";
import { hasPermission, isOwnerAdmin, requireApiUser } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { buildTimelessReelPrompt, createVideoJob } from "@/lib/videoProvider";
import Reel from "@/models/Reel";

export async function POST(request) {
  try {
    const auth = await requireApiUser(request);
    if (auth.error) return auth.error;
    if (!isOwnerAdmin(auth.user) && !hasPermission(auth.user, "create_content")) {
      return NextResponse.json({ error: "You do not have permission to create reel videos." }, { status: 403 });
    }
    const { reelId } = await request.json();
    if (!reelId) return NextResponse.json({ error: "Reel id is required." }, { status: 400 });

    const clientIds = await accessibleClientIds(auth.user);
    const reel = await Reel.findOne({ _id: reelId, clientId: { $in: clientIds } }).populate("clientId", "businessName industry location");
    if (!reel) return NextResponse.json({ error: "Reel not found." }, { status: 404 });

    const prompt = buildTimelessReelPrompt(reel);
    const result = await createVideoJob({ reel, prompt });
    if (!result.configured) {
      reel.videoPrompt = prompt;
      reel.videoError = result.message;
      await reel.save();
      return NextResponse.json({ error: result.message, prompt }, { status: 400 });
    }
    if (!result.ok) {
      reel.videoPrompt = prompt;
      reel.videoProvider = result.provider;
      reel.videoStatus = "Failed";
      reel.videoError = result.message;
      await reel.save();
      return NextResponse.json({ error: result.message, prompt }, { status: 502 });
    }

    reel.videoProvider = result.provider;
    reel.videoJobId = result.jobId;
    reel.videoStatus = result.videoUrl ? "Generated" : "Queued";
    reel.videoUrl = result.videoUrl;
    reel.videoPrompt = prompt;
    reel.videoError = "";
    reel.status = result.videoUrl ? "Review" : "Editing";
    await reel.save();

    await createAuditLog({ request, user: auth.user, action: "reel_video_job_created", entityType: "Reel", entityId: reel._id, details: { provider: result.provider, jobId: result.jobId } });
    return NextResponse.json({ reel, video: result, prompt });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Video job creation failed." }, { status: 500 });
  }
}
