import mongoose from "mongoose";

const LeadSchema = new mongoose.Schema(
  {
    agencyName: { type: String, required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client" },
    source: { type: String, enum: ["manual", "google_maps", "website", "referral", "instagram", "whatsapp"], default: "manual", index: true },
    placeId: { type: String, default: "", index: true },
    businessName: { type: String, required: true, trim: true },
    industry: { type: String, default: "" },
    category: { type: String, default: "" },
    location: { type: String, default: "" },
    address: { type: String, default: "" },
    phone: { type: String, default: "" },
    website: { type: String, default: "" },
    googleMapsUri: { type: String, default: "" },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    latitude: { type: Number },
    longitude: { type: Number },
    score: { type: Number, default: 0, index: true },
    status: { type: String, enum: ["New", "Shortlisted", "Contacted", "Follow-up", "Proposal Sent", "Won", "Lost"], default: "New", index: true },
    priority: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
    ownerNotes: { type: String, default: "" },
    nextAction: { type: String, default: "" },
    lastContactedAt: { type: Date },
    dataExpiresAt: { type: Date },
    searchQuery: { type: String, default: "" }
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

LeadSchema.index({ agencyName: 1, placeId: 1 }, { unique: true, partialFilterExpression: { placeId: { $type: "string", $gt: "" } } });

export default mongoose.models.Lead || mongoose.model("Lead", LeadSchema);
