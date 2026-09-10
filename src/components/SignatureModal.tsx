// src/components/SignatureModal.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import { X, Check, RotateCcw, PenTool, Type } from "lucide-react";

interface SignatureModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (signatureData: string) => void;
}

export function SignatureModal({ open, onClose, onSave }: SignatureModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [mode, setMode] = useState<"draw" | "type">("draw");
  const [typedName, setTypedName] = useState("");

  useEffect(() => {
    if (open && mode === "draw") {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.strokeStyle = "#1b365d";
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Load existing drawn signature if present
      const saved = localStorage.getItem("svl_digital_signature");
      if (saved && saved.startsWith("data:image")) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          setHasDrawn(true);
        };
        img.src = saved;
      }
    }
  }, [open, mode]);

  if (!open) return null;

  function startDrawing(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setHasDrawn(true);
  }

  function draw(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function stopDrawing() {
    setIsDrawing(false);
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  }

  function handleSave() {
    if (mode === "draw") {
      const canvas = canvasRef.current;
      if (!canvas || !hasDrawn) return;
      const dataUrl = canvas.toDataURL("image/png");
      onSave(dataUrl);
      onClose();
    } else {
      if (!typedName.trim()) return;
      onSave(`text:${typedName.trim()}`);
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/30 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-xl border border-line bg-surface p-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <PenTool size={18} className="text-pine" />
            <h3 className="font-serif text-base font-semibold text-ink">
              Digital Signature
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-ink-soft hover:bg-line/50 hover:text-ink"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Mode switcher tabs */}
        <div className="mt-4 flex rounded-md border border-line bg-paper p-0.5 text-xs font-medium">
          <button
            type="button"
            onClick={() => setMode("draw")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded py-1.5 transition-all ${
              mode === "draw"
                ? "bg-surface text-pine-deep font-semibold shadow-xs"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            <PenTool size={13} />
            <span>Draw Signature</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("type")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded py-1.5 transition-all ${
              mode === "type"
                ? "bg-surface text-pine-deep font-semibold shadow-xs"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            <Type size={13} />
            <span>Type Signature</span>
          </button>
        </div>

        {mode === "draw" ? (
          <div className="mt-4 flex flex-col items-center">
            <div className="relative w-full overflow-hidden rounded-lg border-2 border-dashed border-[#1b365d]/40 bg-white">
              <canvas
                ref={canvasRef}
                width={360}
                height={130}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full cursor-crosshair touch-none"
              />
              {!hasDrawn && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-[#1b365d]/40">
                  Draw your signature here
                </div>
              )}
            </div>

            <div className="mt-2 flex w-full justify-between text-xs text-ink-soft">
              <span>Color: Blue Ink</span>
              <button
                type="button"
                onClick={clearCanvas}
                className="flex items-center gap-1 text-rust hover:underline"
              >
                <RotateCcw size={12} /> Clear
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <label className="flex flex-col gap-1 text-xs text-ink-soft">
              <span>Signer Name</span>
              <input
                type="text"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder="e.g. S. V. Lakshmi"
                className="rounded-md border border-line-strong bg-surface px-3 py-2 text-sm outline-none focus:border-pine"
              />
            </label>

            {typedName && (
              <div className="rounded-lg border border-[#1b365d]/30 bg-blue-50/30 p-4 text-center">
                <div className="font-serif italic text-2xl font-bold tracking-wider text-[#1b365d]">
                  {typedName}
                </div>
                <div className="mt-1 text-[10px] tracking-widest text-[#1b365d]/60 uppercase">
                  Digitally Signed
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-6 flex justify-end gap-2.5 border-t border-line pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-line px-3.5 py-1.5 text-xs font-medium text-ink-soft hover:bg-line/40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={mode === "draw" ? !hasDrawn : !typedName.trim()}
            className="flex items-center gap-1.5 rounded-md bg-pine px-4 py-1.5 text-xs font-medium text-surface shadow-xs hover:opacity-90 disabled:opacity-50"
          >
            <Check size={14} /> Save Signature
          </button>
        </div>
      </div>
    </div>
  );
}
