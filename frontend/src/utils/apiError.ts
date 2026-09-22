import { isAxiosError } from "axios";
import type { ApiErrorResponse } from "@/types/lead.types";

/** แปลง error จาก axios ให้เป็นข้อความที่ผู้ใช้ทั่วไปอ่านเข้าใจ ไม่โชว์ stack trace */
export function toFriendlyErrorMessage(error: unknown): string {
  if (isAxiosError<ApiErrorResponse>(error)) {
    if (error.code === "ECONNABORTED") {
      return "คำขอใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง (ระบบอาจกำลังประมวลผลจำนวนมาก)";
    }
    if (!error.response) {
      return "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่อแล้วลองใหม่อีกครั้ง";
    }
    const backendMessage = error.response.data?.message;
    if (error.response.status === 400) {
      return backendMessage ? `ข้อมูลไม่ถูกต้อง: ${backendMessage}` : "ข้อมูลที่กรอกไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง";
    }
    if (error.response.status >= 500) {
      return "เซิร์ฟเวอร์เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้งในภายหลัง";
    }
    return backendMessage ?? "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ กรุณาลองใหม่อีกครั้ง";
  }
  return "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ กรุณาลองใหม่อีกครั้ง";
}
