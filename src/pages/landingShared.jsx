import { useState, useEffect } from "react";
import campusBackground from "../assets/unila-logo.png";
import { Button } from "../components/ui/button";

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const TIMELINE_TONE_STYLES = {
  neutral: "bg-[#94A3B8]",
  info: "bg-[#3B82F6]",
  warning: "bg-[#FBBF24]",
  success: "bg-[#22C55E]",
  danger: "bg-[#EF4444]",
};

export const statusConfig = {
  diterima: { label: "Diterima", color: "bg-[#E0E7FF] text-[#4F46E5] border-[#C7D2FE]", icon: "message" },
  diproses: { label: "Sedang Diproses", color: "bg-[#FFE8D9] text-[#EA580C] border-[#FFD4A5]", icon: "clock" },
  "menunggu validasi": { label: "Menunggu Validasi", color: "bg-[#FFE8D9] text-[#EA580C] border-[#FFD4A5]", icon: "clock" },
  selesai: { label: "Selesai", color: "bg-[#D4F4E2] text-[#16A34A] border-[#A5E8C8]", icon: "check" },
  ditolak: { label: "Ditolak", color: "bg-[#FEE2E2] text-[#DC2626] border-[#FCA5A5]", icon: "alert" },
};

export const reportSectionBackgroundStyle = {
  backgroundImage: `linear-gradient(135deg, rgba(3, 16, 40, 0.92), rgba(0, 61, 130, 0.85)), url(${campusBackground})`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundAttachment: "fixed",
};

export const formatDateTime = (value) => {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    return value;
  }
};

export const formatFileSize = (bytes) => {
  if (!bytes) return null;
  const sizeInKB = bytes / 1024;
  if (sizeInKB < 1024) {
    return `${Math.max(sizeInKB, 1).toFixed(0)} KB`;
  }
  return `${(sizeInKB / 1024).toFixed(2)} MB`;
};

export const copyToClipboard = async (value) => {
  if (!value) return false;
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch (error) {
    // ignore clipboard write failure and use fallback
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-9999px";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  try {
    return document.execCommand("copy");
  } catch (error) {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
};

export function TicketCopyButton({ ticketId }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return undefined;
    const timeoutId = setTimeout(() => setCopied(false), 1200);
    return () => clearTimeout(timeoutId);
  }, [copied]);

  const handleCopy = async () => {
    const success = await copyToClipboard(ticketId);
    if (success) {
      setCopied(true);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={`h-8 transition-all duration-300 ${copied ? "copy-pulse" : ""}`}
      onClick={handleCopy}
    >
      {copied ? "Disalin!" : "Salin"}
    </Button>
  );
}
