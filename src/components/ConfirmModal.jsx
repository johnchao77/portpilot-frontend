// src/components/ConfirmModal.jsx
import React from "react";

/**
 * Reusable confirmation modal.
 *
 * Props:
 * - open: boolean
 * - title?: string
 * - message?: string
 * - confirmText?: string
 * - cancelText?: string
 * - variant?: "default" | "danger"
 * - loading?: boolean         // show "Working..." on confirm button
 * - disableConfirm?: boolean  // disable the confirm button
 * - onConfirm: () => void
 * - onCancel: () => void
 */
export default function ConfirmModal({
  open,
  title = "Confirm",
  message,
  confirmText = "OK",
  cancelText = "Cancel",
  variant = "default",
  loading = false,
  disableConfirm = false,
  onConfirm,
  onCancel,
}) {
  // Add ESC/Enter handlers only while open (hook is called unconditionally)
  React.useEffect(() => {
    const onKey = (e) => {
      if (!open) return;
      if (e.key === "Escape") onCancel?.();
      if (e.key === "Enter") onConfirm?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel, onConfirm]);

  const confirmBtnClass =
    variant === "danger"
      ? "bg-red-600 hover:bg-red-700 text-white"
      : "bg-blue-600 hover:bg-blue-700 text-white";

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()} // prevent bubbling to backdrop
      >
        <h2 className="text-lg font-semibold">{title}</h2>
        {message && (
          <p className="mt-3 text-sm text-gray-600 whitespace-pre-line">
            {message}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-50"
            onClick={onCancel}
            autoFocus
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={disableConfirm || loading}
            className={`px-4 py-2 rounded ${confirmBtnClass} disabled:opacity-50 disabled:cursor-not-allowed`}
            onClick={onConfirm}
          >
            {loading ? "Working..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
