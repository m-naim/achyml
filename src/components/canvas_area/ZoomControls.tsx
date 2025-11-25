import React, { useEffect } from "react";
import { ZoomIn, ZoomOut, RefreshCcw } from "lucide-react";

export function ZoomControls({ onZoomIn, onZoomOut, onZoomReset }: {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
}) {
  // Keyboard shortcuts: + (zoom in), - (zoom out), 0 (reset)
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "+" || e.key === "=") {
        onZoomIn();
      }
      if (e.key === "-") {
        onZoomOut();
      }
      if (e.key === "0") {
        onZoomReset();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onZoomIn, onZoomOut, onZoomReset]);

  return (
    <div style={{
      position: "absolute",
      left: 16,
      bottom: 16,
      zIndex: 10,
      display: "flex",
      flexDirection: "column",
      gap: 8,
      background: "rgba(255,255,255,0.85)",
      borderRadius: 8,
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      padding: 6
    }}>
      <button
        title="Zoom In (+)"
        style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
        onClick={onZoomIn}
      >
        <ZoomIn color="#1976d2" size={24} />
      </button>
      <button
        title="Zoom Out (-)"
        style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
        onClick={onZoomOut}
      >
        <ZoomOut color="#1976d2" size={24} />
      </button>
      <button
        title="Reset View (0)"
        style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
        onClick={onZoomReset}
      >
        <RefreshCcw color="#1976d2" size={24} />
      </button>
    </div>
  );
}
