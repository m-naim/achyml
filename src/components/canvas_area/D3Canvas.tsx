import React, { useRef, useImperativeHandle, forwardRef } from "react";
import * as d3 from "d3";
import { useStore } from "../../store/store";
import type { Model } from "../../types";
import { ZoomControls } from "./ZoomControls";
import { useD3CanvasEffect } from "../../utils/useD3CanvasEffect";

// Expose zoomToElement by ref
export type D3CanvasHandle = {
  zoomToElement: (id: string) => void;
};

const D3Canvas = forwardRef<D3CanvasHandle, { modelOverride?: Model }>(
  function D3Canvas({ modelOverride }, ref) {
    const model = modelOverride ?? useStore((s) => s.model);
    const select = useStore((s) => s.select);
    const svgRef = useRef<SVGSVGElement | null>(null);
    const gRef = useRef<SVGGElement | null>(null);
    const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

    useD3CanvasEffect({
      model,
      select,
      ref: svgRef,
      gRef,
      zoomRef
    });

    // Zoom control handlers
    const handleZoomIn = () => {
      if (svgRef.current && zoomRef.current) {
        d3.select(svgRef.current).transition().duration(200).call(zoomRef.current.scaleBy, 2);
      }
    };
    const handleZoomOut = () => {
      if (svgRef.current && zoomRef.current) {
        d3.select(svgRef.current).transition().duration(200).call(zoomRef.current.scaleBy, 0.8);
      }
    };
    const handleZoomReset = () => {
      if (svgRef.current && zoomRef.current) {
        d3.select(svgRef.current).transition().duration(200).call(zoomRef.current.transform, d3.zoomIdentity);
      }
    };

    // Zoom to element by id
    const zoomToElement = (id: string) => {
      if (!svgRef.current || !gRef.current || !zoomRef.current) return;
      // Find the element's node
      const elNode = gRef.current.querySelector(`[data-id="${id}"]`);
      if (elNode) {
        // Get transform attribute
        const transformAttr = (elNode as SVGGElement).getAttribute("transform");
        let tx = 0, ty = 0;
        if (transformAttr) {
          const match = /translate\(([^,]+),\s*([^)]+)\)/.exec(transformAttr);
          if (match) {
            tx = parseFloat(match[1]);
            ty = parseFloat(match[2]);
          }
        }
        // Get bounding box
        const bbox = (elNode as SVGGElement).getBBox();
        const svg = svgRef.current;
        const width = svg.clientWidth;
        const height = svg.clientHeight;
        // Center the element in the view
        const scale = 10;
        const x = tx + bbox.x + bbox.width / 2;
        const y = ty + bbox.y + bbox.height / 2;
        const transform = d3.zoomIdentity
          .translate(width / 2 - x * scale, height / 2 - y * scale)
          .scale(scale);
        d3.select(svg).transition().duration(350).call(zoomRef.current.transform, transform);
      }
    };

    useImperativeHandle(ref, () => ({
      zoomToElement
    }));

    return (
      <div style={{ width: "100%", height: "100%", position: "relative" }}>
        <ZoomControls
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onZoomReset={handleZoomReset}
        />
        <svg ref={svgRef} style={{ width: "100%", height: "100%", overflow: "visible" }}>
          <g ref={gRef} />
        </svg>
      </div>
    );
  }
);

export default D3Canvas;
