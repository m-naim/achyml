import React from "react";

export function ZoomControls({ onZoomIn, onZoomOut, onZoomReset }: {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
}) {
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
        title="Zoom In"
        style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
        onClick={onZoomIn}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="10" y="4" width="4" height="16" rx="2" fill="#1976d2"/>
          <rect x="4" y="10" width="16" height="4" rx="2" fill="#1976d2"/>
        </svg>
      </button>
      <button
        title="Zoom Out"
        style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
        onClick={onZoomOut}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="10" width="16" height="4" rx="2" fill="#1976d2"/>
        </svg>
      </button>
      <button
        title="Reset View"
        style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
        onClick={onZoomReset}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="#1976d2" strokeWidth="2" fill="none"/>
          <path d="M12 8v4l3 3" stroke="#1976d2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </svg>
      </button>
    </div>
  );
}
