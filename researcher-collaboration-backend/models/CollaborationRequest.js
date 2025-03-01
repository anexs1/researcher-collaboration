// models/CollaborationRequest.js

const mongoose = require("mongoose");

const collaborationRequestSchema = new mongoose.Schema({
  researcherId: { type: mongoose.Schema.Types.ObjectId, ref: "Researcher" },
  details: { type: String, required: true },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  timestamp: { type: Date, default: Date.now },
});

const CollaborationRequest = mongoose.model(
  "CollaborationRequest",
  collaborationRequestSchema
);

module.exports = CollaborationRequest;
