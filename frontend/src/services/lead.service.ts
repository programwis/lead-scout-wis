import { api } from "./api";
import type {
  ConfirmRequest,
  ConfirmResponse,
  GenerateRequest,
  GenerateResponse,
  Lead,
  ModelsResponse,
} from "@/types/lead.types";

/** /generate ทำ search + crawl + AI ตามลำดับแบบ synchronous จึงใช้เวลานาน ต้องเผื่อ timeout ยาว */
const GENERATE_TIMEOUT_MS = 10 * 60 * 1000;

export async function generateLeads(payload: GenerateRequest): Promise<GenerateResponse> {
  const { data } = await api.post<GenerateResponse>("/api/leads/generate", payload, {
    timeout: GENERATE_TIMEOUT_MS,
  });
  return data;
}

export async function confirmLeads(payload: ConfirmRequest): Promise<ConfirmResponse> {
  const { data } = await api.post<ConfirmResponse>("/api/leads/confirm", payload);
  return data;
}

export async function getModels(): Promise<ModelsResponse> {
  const { data } = await api.get<ModelsResponse>("/api/leads/models");
  return data;
}

export async function getLeads(params?: { limit?: number; industry?: string }): Promise<Lead[]> {
  const { data } = await api.get<{ success: true; leads: Lead[] }>("/api/leads", { params });
  return data.leads;
}
