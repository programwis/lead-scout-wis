import mongoose from "mongoose";
import type { Lead } from "../types/lead.type.js";

const leadSchema = new mongoose.Schema<Lead>(
  {
    companyName: { type: String, required: true },
    industry: { type: String, index: true },
    industryDetail: String,
    sourceType: String,
    website: String,
    /**
     * `sparse` จำเป็น — lead ที่ไม่มีเว็บทางการจะไม่มีฟิลด์นี้เลย ถ้า index ไม่ sparse
     * เอกสารที่ไม่มี domain จะถูกมองว่า `null` เหมือนกันหมดแล้วชน unique กันเอง
     * (ต้องไม่เขียน `domain: null` ลงไปด้วย — sparse ข้ามเฉพาะเอกสารที่ "ไม่มีฟิลด์")
     */
    domain: { type: String, unique: true, sparse: true },
    phone: String,
    email: String,
    address: String
  },
  { timestamps: true }
);

export const LeadModel = mongoose.model("Lead", leadSchema);
