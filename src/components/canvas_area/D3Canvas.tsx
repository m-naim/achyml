import React, { useRef } from "react";
import * as d3 from "d3";
import { useStore } from "../../store/store";
import type { ComponentItem, LinkItem, Model } from "../../types";
import { ZoomControls } from "./ZoomControls";
import { useD3CanvasEffect } from "../../utils/useD3CanvasEffect";

// Updated spacing constants
const COL_WIDTH = 320;
const ROW_HEIGHT = 240;        // Plus grand espace vertical entre composants
const PARENT_PADDING = 32;     // Padding interne plus grand
const ELEMENT_H = 40;
const ELEMENT_GAP = 24;        // Plus d'espace entre les éléments


export default function D3Canvas({ modelOverride }: { modelOverride?: Model }) {
  const model = modelOverride ?? useStore((s) => s.model);
  const select = useStore((s) => s.select);
  const ref = useRef<SVGSVGElement | null>(null);
  const gRef = useRef<SVGGElement | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  useD3CanvasEffect({
    model,
    select,
    ref,
    gRef,
    zoomRef
  });

  // Zoom control handlers
  const handleZoomIn = () => {
    if (ref.current && zoomRef.current) {
      d3.select(ref.current).transition().duration(200).call(zoomRef.current.scaleBy, 1.2);
    }
  };
  const handleZoomOut = () => {
    if (ref.current && zoomRef.current) {
      d3.select(ref.current).transition().duration(200).call(zoomRef.current.scaleBy, 0.8);
    }
  };
  const handleZoomReset = () => {
    if (ref.current && zoomRef.current) {
      d3.select(ref.current).transition().duration(200).call(zoomRef.current.transform, d3.zoomIdentity);
    }
  };

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <ZoomControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomReset={handleZoomReset}
      />
      <svg ref={ref} style={{ width: "100%", height: "100%", overflow: "visible" }}>
        <g ref={gRef} />
      </svg>
    </div>
  );
}
