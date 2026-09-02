import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { env } from "../config/env.js";
import { cleanText } from "../utils/text.utils.js";
import type { ExtractedLead } from "../types/lead.type.js";

const client = new Anthropic({ apiKey: env.anthropicApiKey });

const maxTextLength = 12000;
const maxContactLinks = 20;

/**
 * โมเดลกลุ่มนี้ไม่รองรับ output_config.effort — ส่งไปจะได้ 400 กลับมา
 * โมเดลอื่น (opus / sonnet รุ่น 4.6 ขึ้นไป) รองรับ และเราส่ง effort: "low"
 * ให้อัตโนมัติเพื่อลดค่า output token
 */
const modelsWithoutEffort = ["claude-haiku-4-5", "claude-sonnet-4-5"];

const supportsEffort = !modelsWithoutEffort.some((model) => env.aiModel.startsWith(model));

const extractedLeadSchema = z.object({
  companyName: z.string().nullable(),
  industry: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  address: z.string().nullable()
});

const emptyLead: ExtractedLead = {
  companyName: null,
  industry: null,
  phone: null,
  email: null,
  address: null
};

const systemPrompt = [
  "You extract business contact details from website text.",
  "Use only information present in the input; never guess or invent values.",
  "Return null for anything the input does not contain.",
  "Keep phone numbers and addresses exactly as written on the site.",
  "Emails often hide in mailto: links or are obfuscated to dodge scrapers",
  "(info (at) example.com, info[dot]example[dot]com) - normalise those to a real address.",
  "If several emails appear, prefer the company's main contact (info@, contact@, sales@)",
  "over personal or webmaster addresses."
].join(" ");

export async function extractLead(text: string, website: string, links: string[] = []): Promise<ExtractedLead> {
  const content = cleanText(text).slice(0, maxTextLength);
  const contactLinks = findContactLinks(links);

  const prompt = [
    `Website: ${website}`,
    contactLinks.length ? `\nContact links in the page HTML:\n${contactLinks.join("\n")}` : "",
    `\nPage text:\n${content}`
  ].join("\n");

  const response = await client.messages.parse({
    model: env.aiModel,
    max_tokens: 16000,
    system: systemPrompt,
    output_config: {
      ...(supportsEffort ? { effort: "low" as const } : {}),
      format: zodOutputFormat(extractedLeadSchema)
    },
    messages: [{ role: "user", content: prompt }]
  });

  return response.parsed_output ?? emptyLead;
}

/**
 * ดึง mailto: / tel: ออกจาก href — อีเมลกับเบอร์มักซ่อนอยู่ในลิงก์
 * ไม่ได้อยู่ในข้อความที่มองเห็น (innerText จึงจับไม่ได้)
 */
function findContactLinks(links: string[]) {
  const found = links
    .filter((link) => link.startsWith("mailto:") || link.startsWith("tel:"))
    .map((link) => {
      const withoutQuery = link.split("?")[0] ?? link;

      try {
        return decodeURIComponent(withoutQuery);
      } catch {
        return withoutQuery;
      }
    })
    .filter((link) => link !== "mailto:" && link !== "tel:");

  return [...new Set(found)].slice(0, maxContactLinks);
}
