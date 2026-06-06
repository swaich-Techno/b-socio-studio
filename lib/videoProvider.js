function secondsFromDuration(value) {
  const match = String(value || "15").match(/d+/);
  const seconds = match ? Number(match[0]) : 15;
  return Math.min(Math.max(seconds, 5), 30);
}

export function buildTimelessReelPrompt(reel) {
  const scenes = Array.isArray(reel.scenes) ? reel.scenes.join(" ") : "";
  const hashtags = Array.isArray(reel.hashtags) ? reel.hashtags.join(" ") : "";
  return [
    "Create a timeless vertical social media reel, 9:16, premium local business style.",
    "Avoid dated memes, political references, seasonal-only trends unless provided, and text that will expire quickly.",
    "Business: " + (reel.clientId?.businessName || "client business") + ".",
    "Product or service: " + (reel.productName || "featured offer") + ".",
    "Goal: " + (reel.goal || "awareness") + ".",
    "Hook: " + (reel.hook || "show the strongest customer benefit immediately") + ".",
    "Script: " + (reel.script || "clear product benefit, proof, and call to action") + ".",
    "Scene plan: " + scenes,
    "Voiceover: " + (reel.voiceover || "friendly, confident, local tone") + ".",
    "Caption direction: " + (reel.caption || "simple CTA") + ".",
    "Editing: " + (reel.editingInstructions || "fast cuts, readable text, natural colors") + ".",
    "Hashtags for context only: " + hashtags
  ].filter(Boolean).join("\n");
}

export async function createVideoJob({ reel, prompt }) {
  const apiKey = process.env.RUNWAY_API_KEY || process.env.VIDEO_API_KEY;
  const endpoint = process.env.REEL_VIDEO_API_ENDPOINT || process.env.RUNWAY_VIDEO_API_ENDPOINT;
  const provider = process.env.REEL_VIDEO_PROVIDER || "runway-compatible";

  if (!apiKey || !endpoint) {
    return {
      configured: false,
      provider,
      message: "Add RUNWAY_API_KEY and REEL_VIDEO_API_ENDPOINT in Vercel to enable video job creation."
    };
  }

  const payload = {
    promptText: prompt,
    ratio: "9:16",
    duration: secondsFromDuration(reel.duration),
    metadata: {
      reelId: reel._id?.toString?.(),
      clientId: reel.clientId?._id?.toString?.() || reel.clientId?.toString?.(),
      productName: reel.productName || "",
      source: "b-socio-studio"
    }
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + apiKey
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      configured: true,
      provider,
      ok: false,
      message: data.error?.message || data.message || "Video provider rejected the job."
    };
  }

  return {
    configured: true,
    provider,
    ok: true,
    jobId: data.id || data.taskId || data.jobId || data.task?.id || "",
    status: data.status || data.task?.status || "queued",
    videoUrl: data.videoUrl || data.output?.[0] || data.result?.url || "",
    raw: data
  };
}
