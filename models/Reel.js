import mongoose from "mongoose";

const ReelSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true, index: true },
    productName: { type: String, default: "" },
    goal: { type: String, default: "" },
    duration: { type: String, default: "15 sec" },
    tone: { type: String, default: "" },
    language: { type: String, default: "" },
    hook: { type: String, default: "" },
    script: { type: String, default: "" },
    scenes: { type: [String], default: [] },
    voiceover: { type: String, default: "" },
    caption: { type: String, default: "" },
    hashtags: { type: [String], default: [] },
    editingInstructions: { type: String, default: "" },
    coverPrompt: { type: String, default: "" },
    status: { type: String, enum: ["Idea", "Script Ready", "Shooting", "Editing", "Review", "Approved", "Posted"], default: "Idea" },
    assignedTo: { type: String, default: "" },
    videoProvider: { type: String, default: "" },
    videoJobId: { type: String, default: "", index: true },
    videoStatus: { type: String, enum: ["Not Requested", "Queued", "Running", "Generated", "Failed"], default: "Not Requested", index: true },
    videoUrl: { type: String, default: "" },
    videoPrompt: { type: String, default: "" },
    videoError: { type: String, default: "" }
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

export default mongoose.models.Reel || mongoose.model("Reel", ReelSchema);
