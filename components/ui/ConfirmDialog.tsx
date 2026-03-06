"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    variant?: "danger" | "default";
    loading?: boolean;
}

export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel = "Confirmer",
    cancelLabel = "Annuler",
    onConfirm,
    variant = "default",
    loading = false,
}: ConfirmDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-2xl max-w-sm">
                <DialogHeader>
                    <DialogTitle className="text-sm font-semibold text-zinc-900 dark:text-white">
                        {title}
                    </DialogTitle>
                </DialogHeader>

                {description && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 -mt-1">{description}</p>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                        className="px-4 h-9 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            onConfirm();
                            onOpenChange(false);
                        }}
                        disabled={loading}
                        className={`inline-flex items-center gap-2 px-4 h-9 rounded-xl text-sm font-medium disabled:opacity-50 transition-colors ${variant === "danger"
                                ? "bg-red-600 text-white hover:bg-red-700"
                                : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-100"
                            }`}
                    >
                        {loading && <Loader2 size={13} className="animate-spin" />}
                        {confirmLabel}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
