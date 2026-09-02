import mongoose from "mongoose";
import type { Lead } from "../types/lead.type.js";

const leadSchema = new mongoose.Schema<Lead>(
  {
    companyName: { type: String, required: true },
    industry: String,
    website: String,
    domain: { type: String, unique: true },
    phone: String,
    email: String,
    address: String
  },
  { timestamps: true }
);

export const LeadModel = mongoose.model("Lead", leadSchema);
