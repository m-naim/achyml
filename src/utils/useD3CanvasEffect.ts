import { useEffect } from "react";
import * as d3 from "d3";
import { computeElementPositions, computeCanvasSize, computeDynamicComponentPositions } from "./d3Layout";
import { renderSvgDefs } from "./d3Defs";
import type { Model } from "../types";
import { renderComponents } from "../components/canvas_area/d3Elements/component";
import { renderElements } from "../components/canvas_area/d3Elements/element";
import { renderLinks } from "../components/canvas_area/d3Elements/link";

type Props = {
  model: Model;
  select: (id?: string | null) => void;
  ref: React.RefObject<SVGSVGElement>;
  gRef: React.RefObject<SVGGElement>;
  zoomRef: React.MutableRefObject<d3.ZoomBehavior<SVGSVGElement, unknown> | null>;
};



export function useD3CanvasEffect({ model, select, ref, gRef, zoomRef }: Props) {
  useEffect(() => {
    if (!ref.current || !gRef.current) return;
    const svg = d3.select(ref.current);
    const g = d3.select(gRef.current);

    svg.on(".zoom", null);

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.8, 7])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    zoomRef.current = zoom;
    svg.call(zoom);

    g.selectAll("*").remove();

    // --- SVG defs ---
    renderSvgDefs(g);

    // --- Layout ---
    const compPositions = computeDynamicComponentPositions(model.components);
    const elPositions = computeElementPositions(model.components, compPositions);
    const { maxX, maxY } = computeCanvasSize(compPositions);

    svg.attr("viewBox", `0 0 ${Math.max(1000, maxX)} ${Math.max(600, maxY)}`)
       .attr("preserveAspectRatio", "xMidYMid meet");

    // --- Render components ---
    renderComponents(g, model, compPositions, select);

    // --- Render links ---
    const linkGroup = renderLinks(g, model, elPositions);

    // --- Render elements ---
    renderElements(g, model, elPositions, linkGroup, select);
  }, [model, select]);
}
