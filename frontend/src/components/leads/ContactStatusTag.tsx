import { Tag } from "antd";
import type { ContactStatus } from "@/types/lead.types";

const CONFIG: Record<ContactStatus, { label: string; color: string }> = {
  contactable: { label: "Contactable", color: "success" },
  partial: { label: "Partial", color: "warning" },
  no_contact: { label: "No Contact", color: "default" },
};

export default function ContactStatusTag({ status }: { status: ContactStatus }) {
  const { label, color } = CONFIG[status];
  return <Tag color={color}>{label}</Tag>;
}
