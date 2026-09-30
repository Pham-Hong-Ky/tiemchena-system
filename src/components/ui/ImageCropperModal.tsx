"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  X,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Move,
  Check,
  RotateCcw,
  Loader2,
  Crop,
  ImageIcon,
} from "lucide-react";
import { toast } from "@/context/ToastContext";

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedDataUrl: string) => void;
  aspectRatio?: number; // width / height, default 4/3
}

export function ImageCropperModal({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
  aspectRatio = 4 / 3,
}: ImageCropperModalProps) {
  const [mounted, setMounted] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset controls when a new image is loaded
  useEffect(() => {
    if (!imageSrc || !isOpen) return;

    setZoom(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
    setImageLoaded(false);
    setImageDimensions(null);

    const img = new Image();
    const isRemote = imageSrc.startsWith("http://") || imageSrc.startsWith("https://");
    const resolvedSrc = isRemote ? `/api/proxy-image?url=${encodeURIComponent(imageSrc)}` : imageSrc;

    if (isRemote) {
      img.crossOrigin = "anonymous";
    }

    img.onload = () => {
      imageRef.current = img;
      setImageDimensions({ width: img.naturalWidth || img.width, height: img.naturalHeight || img.height });
      setImageLoaded(true);
    };

    img.onerror = () => {
      console.warn("Failed to load image via proxy, trying direct fallback");
      const fallbackImg = new Image();
      fallbackImg.onload = () => {
        imageRef.current = fallbackImg;
        setImageDimensions({ width: fallbackImg.naturalWidth || fallbackImg.width, height: fallbackImg.naturalHeight || fallbackImg.height });
        setImageLoaded(true);
      };
      fallbackImg.onerror = () => {
        toast.error("Không thể tải hình ảnh này để căn chỉnh. Vui lòng thử chọn ảnh trực tiếp từ máy tính/điện thoại.");
        setImageLoaded(false);
      };
      fallbackImg.src = imageSrc;
    };

    img.src = resolvedSrc;
  }, [imageSrc, isOpen]);

  // Draw the preview onto the interactive canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !imageLoaded) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.save();

    // Background filler
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Transform coordinate system to center of canvas + user drag offset
    ctx.translate(canvasWidth / 2 + offset.x, canvasHeight / 2 + offset.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);

    // Calculate base fit size (cover mode)
    const imgAspect = img.width / img.height;
    let drawWidth = canvasWidth;
    let drawHeight = canvasHeight;

    if (imgAspect > aspectRatio) {
      drawHeight = canvasHeight;
      drawWidth = canvasHeight * imgAspect;
    } else {
      drawWidth = canvasWidth;
      drawHeight = canvasWidth / imgAspect;
    }

    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    ctx.restore();

    // Draw crop guide lines (Rule of thirds grid)
    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 1;

    // 1/3 and 2/3 horizontal lines
    ctx.beginPath();
    ctx.moveTo(0, canvasHeight / 3);
    ctx.lineTo(canvasWidth, canvasHeight / 3);
    ctx.moveTo(0, (canvasHeight * 2) / 3);
    ctx.lineTo(canvasWidth, (canvasHeight * 2) / 3);

    // 1/3 and 2/3 vertical lines
    ctx.moveTo(canvasWidth / 3, 0);
    ctx.lineTo(canvasWidth / 3, canvasHeight);
    ctx.moveTo((canvasWidth * 2) / 3, 0);
    ctx.lineTo((canvasWidth * 2) / 3, canvasHeight);
    ctx.stroke();

    // Outer border
    ctx.strokeStyle = "#f97316";
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, canvasWidth, canvasHeight);
    ctx.restore();
  }, [offset, rotation, zoom, imageLoaded, aspectRatio]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Mouse & Touch Drag Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - offset.x,
        y: e.touches[0].clientY - offset.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || e.touches.length !== 1) return;
    setOffset({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  // Direct upload without crop (Keep original)
  const handleUseOriginal = async () => {
    if (imageSrc.startsWith("data:")) {
      try {
        setIsExporting(true);
        // Convert dataUrl to blob and upload
        const res = await fetch(imageSrc);
        const blob = await res.blob();
        const file = new File([blob], `original-${Date.now()}.jpg`, { type: blob.type || "image/jpeg" });
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await uploadRes.json();
        if (data.success && data.url) {
          onCropComplete(data.url);
        } else {
          onCropComplete(imageSrc);
        }
      } catch {
        onCropComplete(imageSrc);
      } finally {
        setIsExporting(false);
        onClose();
      }
    } else {
      onCropComplete(imageSrc);
      onClose();
    }
  };

  // Perform Final Crop Export at high resolution (800x600)
  const handleApplyCrop = async () => {
    const img = imageRef.current;
    if (!img) return;

    try {
      setIsExporting(true);
      const outWidth = 800;
      const outHeight = Math.round(outWidth / aspectRatio); // 600px

      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = outWidth;
      exportCanvas.height = outHeight;
      const ctx = exportCanvas.getContext("2d");
      if (!ctx) return;

      // Scale factor from preview canvas (400px width) to export canvas (800px width)
      const previewWidth = canvasRef.current?.width || 400;
      const scaleFactor = outWidth / previewWidth;

      ctx.save();
      ctx.translate(outWidth / 2 + offset.x * scaleFactor, outHeight / 2 + offset.y * scaleFactor);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(zoom * scaleFactor, zoom * scaleFactor);

      const imgAspect = img.width / img.height;
      let drawWidth = previewWidth;
      let drawHeight = previewWidth / aspectRatio;

      if (imgAspect > aspectRatio) {
        drawHeight = previewWidth / aspectRatio;
        drawWidth = drawHeight * imgAspect;
      } else {
        drawWidth = previewWidth;
        drawHeight = previewWidth / imgAspect;
      }

      ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
      ctx.restore();

      // Convert to blob and upload as a static file or base64
      exportCanvas.toBlob(async (blob) => {
        if (!blob) {
          setIsExporting(false);
          return;
        }

        const file = new File([blob], `cropped-${Date.now()}.jpg`, { type: "image/jpeg" });
        const formData = new FormData();
        formData.append("file", file);

        try {
          const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });
          const data = await res.json();
          if (data.success && data.url) {
            onCropComplete(data.url);
          } else {
            // Fallback to data URL
            onCropComplete(exportCanvas.toDataURL("image/jpeg", 0.92));
          }
        } catch {
          onCropComplete(exportCanvas.toDataURL("image/jpeg", 0.92));
        } finally {
          setIsExporting(false);
          onClose();
        }
      }, "image/jpeg", 0.92);
    } catch (err) {
      console.error(err);
      setIsExporting(false);
    }
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div
      style={{ zIndex: 999999 }}
      className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
    >
      <div className="bg-slate-900 text-white rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-700 space-y-4 animate-in zoom-in-95 duration-200 flex flex-col relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-600/20 text-orange-500 flex items-center justify-center font-bold">
              <Crop className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white">
                  Căn Chỉnh Hình Ảnh Món Ăn
                </h3>
                {imageDimensions && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-400 border border-orange-500/30 font-mono font-bold text-xs">
                    {imageDimensions.width} × {imageDimensions.height} px
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Kéo di chuyển, phóng to hoặc xoay để ảnh vừa vặn chuẩn tỉ lệ thẻ 4:3
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewport Canvas Container */}
        <div className="flex flex-col items-center justify-center bg-slate-950 p-3 rounded-2xl border border-slate-800 relative select-none">
          {!imageLoaded ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
              <span className="text-xs font-semibold">Đang tải và chuẩn bị hình ảnh...</span>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-xl border border-slate-700 shadow-lg">
              <canvas
                ref={canvasRef}
                width={400}
                height={300}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleMouseUp}
                className={`w-full max-w-[340px] sm:max-w-[400px] aspect-[4/3] block bg-slate-900 ${
                  isDragging ? "cursor-grabbing" : "cursor-grab"
                }`}
              />
              <div className="absolute top-2 left-2 pointer-events-none bg-black/75 text-[10px] font-bold text-orange-400 px-2 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-1 shadow">
                <Move className="w-3 h-3" /> Kéo để di chuyển
              </div>
              {imageDimensions && (
                <div className="absolute top-2 right-2 pointer-events-none bg-black/85 text-[10px] font-mono font-bold text-white px-2 py-0.5 rounded-md backdrop-blur-xs border border-white/10 flex items-center gap-1 shadow">
                  <span className="text-slate-400 font-sans">Ảnh gốc:</span>
                  <span className="text-orange-400">{imageDimensions.width}×{imageDimensions.height} px</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Adjust Toolbar Controls */}
        <div className="space-y-3 bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/50 text-xs">
          {/* Zoom control */}
          <div className="flex items-center gap-3">
            <span className="text-slate-400 font-bold text-[11px] w-20 shrink-0 flex items-center gap-1">
              <ZoomIn className="w-3.5 h-3.5 text-orange-500" /> Thu phóng:
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(1, +(z - 0.1).toFixed(2)))}
              className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 cursor-pointer"
              title="Thu nhỏ"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 accent-orange-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
            />
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(3, +(z + 0.1).toFixed(2)))}
              className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 cursor-pointer"
              title="Phóng to"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] font-bold text-orange-400 w-10 text-right">
              {zoom.toFixed(1)}x
            </span>
          </div>

          {/* Rotate & Reset controls */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-700/40">
            <button
              type="button"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs transition cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5 text-orange-400" />
              <span>Xoay 90° ({rotation}°)</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-semibold transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đặt lại vị trí</span>
            </button>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            disabled={!imageLoaded || isExporting}
            onClick={handleUseOriginal}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition cursor-pointer"
            title="Sử dụng ảnh nguyên bản không cần cắt chỉnh"
          >
            <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
            <span>Dùng ảnh gốc {imageDimensions ? `(${imageDimensions.width}×${imageDimensions.height})` : ""}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition cursor-pointer text-xs"
            >
              Hủy
            </button>

            <button
              type="button"
              disabled={!imageLoaded || isExporting}
              onClick={handleApplyCrop}
              className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white font-bold rounded-xl shadow-md shadow-orange-600/20 transition flex items-center gap-1.5 cursor-pointer text-xs disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang xuất ảnh...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Áp Dụng Cắt Ảnh (800×600)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
