import { AxiosUtil } from "./axios";
import type { ApiResult } from "@/types/api.types";
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

export function generateLeads(payload: GenerateRequest): Promise<ApiResult<GenerateResponse>> {
  return AxiosUtil.createRequest<GenerateResponse>({
    method: "POST",
    url: "/api/leads/generate",
    data: payload,
    timeout: GENERATE_TIMEOUT_MS,
  });
}

export function confirmLeads(payload: ConfirmRequest): Promise<ApiResult<ConfirmResponse>> {
  return AxiosUtil.createRequest<ConfirmResponse>({
    method: "POST",
    url: "/api/leads/confirm",
    data: payload,
  });
}

export function getModels(): Promise<ApiResult<ModelsResponse>> {
  return AxiosUtil.createRequest<ModelsResponse>({ method: "GET", url: "/api/leads/models" });
}

export function getLeads(params?: { limit?: number; industry?: string }): Promise<ApiResult<{ success: true; leads: Lead[] }>> {
  return AxiosUtil.createRequest<{ success: true; leads: Lead[] }>({
    method: "GET",
    url: "/api/leads",
    params,
  });
}
