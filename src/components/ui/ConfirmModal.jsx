import React from "react";
import { AlertTriangle } from "lucide-react";

export function ConfirmModal({
  open,
  title,
  description,
  onConfirm,
  onCancel,
  confirmText = "Ya, Tolak Tiket",
  cancelText = "Batal",
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-description"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_25px_60px_rgba(15,23,42,0.15)] border border-gray-100">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-[#E0ECFF] text-[#003D82] flex items-center justify-center shadow-inner">
            <AlertTriangle size={22} />
          </div>
          <div className="flex-1 space-y-2">
            <h2 id="confirm-modal-title" className="text-lg font-semibold text-[#111827]">
              {title}
            </h2>
            <p id="confirm-modal-description" className="text-sm text-[#4B5563] leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            onClick={onCancel}
            className="h-11 rounded-xl border border-gray-200 bg-white px-6 text-sm font-medium text-[#111827] transition-colors hover:border-gray-300 hover:bg-gray-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="h-11 rounded-xl bg-[#003D82] hover:bg-[#002B60] px-6 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition-transform hover:-translate-y-0.5"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
