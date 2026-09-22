import axios from "axios";
import type { AxiosInstance, AxiosResponse } from "axios";
import { toFriendlyErrorMessage } from "@/utils/apiError";
import type { ApiResult } from "@/types/api.types";

const baseAxios: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:4000",
  timeout: 30_000,
  headers: {
    "Content-Type": "application/json",
  },
});

type RequestParams = {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  url: string;
  data?: unknown;
  params?: Record<string, unknown>;
  /** override timeout ของ instance เฉพาะ request นี้ (เช่น endpoint ที่ทำงานนาน) */
  timeout?: number;
};

/** ทุก service เรียก API ผ่านฟังก์ชันนี้ที่เดียว — คืน { ok, data } เสมอ ไม่ throw */
async function createRequest<T>(params: RequestParams): Promise<ApiResult<T>> {
  try {
    const axiosConfig = { params: params.params, timeout: params.timeout };
    let response: AxiosResponse<T>;

    if (params.method === "GET") {
      response = await baseAxios.get<T>(params.url, axiosConfig);
    } else if (params.method === "POST") {
      response = await baseAxios.post<T>(params.url, params.data, axiosConfig);
    } else if (params.method === "PUT") {
      response = await baseAxios.put<T>(params.url, params.data, axiosConfig);
    } else if (params.method === "DELETE") {
      response = await baseAxios.delete<T>(params.url, axiosConfig);
    } else if (params.method === "PATCH") {
      response = await baseAxios.patch<T>(params.url, params.data, axiosConfig);
    } else {
      throw new Error("Invalid method");
    }

    return { ok: true, data: response.data };
  } catch (error) {
    return { ok: false, message: toFriendlyErrorMessage(error) };
  }
}

export const AxiosUtil = {
  createRequest,
};
