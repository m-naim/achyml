import React from "react";

export function SvgChevron({ direction = "left", color = "#1976d2", ...props }) {
  // direction: "left" | "right"
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" {...props}>
      {direction === "left" ? (
        <path d="M7 4L13 10L7 16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      ) : (
        <path d="M13 16L7 10L13 4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      )}
    </svg>
  );
}
