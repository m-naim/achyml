import { useEffect } from "react";
import * as d3 from "d3";
import { getStyle } from "./d3Style";
import { computeElementPositions, computeCanvasSize, computeDynamicComponentPositions } from "./d3Layout";
import { renderSvgDefs } from "./d3Defs";
import type { Model } from "../types";

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
      .scaleExtent([0.3, 2.5])
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
    const compGroup = g.append("g").attr("class", "components");
    for (const comp of model.components || []) {
      const pos = compPositions.get(comp.id)!;
      const elementsCount = comp.elements?.length ?? 0;
      const compHeight = Math.max(
        240,
        elementsCount * (40 + 24) + 32 * 3
      );
      const compStyle = getStyle(model, "component", comp.type);

      const gx = compGroup.append("g").attr("transform", `translate(${pos.x},${pos.y})`);
      gx.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("rx", compStyle.borderRadius ?? 20)
        .attr("ry", compStyle.borderRadius ?? 20)
        .attr("width", 320)
        .attr("height", compHeight)
        .attr("fill", compStyle.background ?? "#fff")
        .attr("stroke", compStyle.border ?? "#000")
        .attr("stroke-width", 1);

      gx.append("text")
        .attr("x", 16)
        .attr("y", 28)
        .attr("fill", compStyle.fontColor ?? "#111")
        .attr("font-weight", "600")
        .attr("font-size", 28)
        .text(comp.name ?? comp.id);

      gx.append("text")
        .attr("x", 16)
        .attr("y", 44)
        .attr("fill", "#666")
        .attr("font-size", 18)
        .text(comp.type ?? "");
    }

    // --- Render elements ---
    const elGroup = g.append("g").attr("class", "elements");
    for (const comp of model.components || []) {
      if (!Array.isArray(comp.elements)) continue;
      comp.elements.forEach((el, idx) => {
        const p = elPositions.get(el.id)!;
        const elStyle = getStyle(model, "element", el.type, el.method);

        const gEl = elGroup.append("g").attr("transform", `translate(${p.x},${p.y})`).attr("data-id", el.id);

        gEl.append("rect")
          .attr("x", 0)
          .attr("y", 0)
          .attr("rx", 10)
          .attr("ry", 10)
          .attr("width", p.width)
          .attr("height", p.height)
          .attr("fill", elStyle.background ?? "#e0e0e0")
          .attr("opacity", 0.98)
          .attr("stroke", "none")
          .attr("cursor", "pointer");

        gEl.append("text")
          .attr("x", 12)
          .attr("y", p.height / 2 + 5)
          .attr("fill", elStyle.fontColor ?? "#fff")
          .attr("font-weight", "500")
          .attr("font-size", elStyle.fontSize ?? 16)
          .attr("cursor", "pointer")
          .text(`${el.method ? el.method + " " : ""}${el.path ?? el.name ?? el.id}`);

        gEl.on("mouseenter", function() {
          const id = d3.select(this).attr("data-id");
          linkGroup.selectAll("path")
            .transition()
            .duration(200)
            .attr("stroke", (d: any) => {
              const p = d3.select(this);
              return (p.attr("data-from") === id || p.attr("data-to") === id) 
                ? "#0984e3" 
                : "#2c3e50";
            })
            .attr("stroke-width", (d: any) => {
              const p = d3.select(this);
              return (p.attr("data-from") === id || p.attr("data-to") === id) 
                ? 3 
                : 2;
            })
            .attr("opacity", (d: any) => {
              const p = d3.select(this);
              return (p.attr("data-from") === id || p.attr("data-to") === id) 
                ? 1 
                : 0.3;
            });
        })
        .on("mouseleave", function() {
          linkGroup.selectAll("path")
            .transition()
            .duration(200)
            .attr("stroke", "#2c3e50")
            .attr("stroke-width", 2)
            .attr("opacity", 0.8);
        })
        .on("click", function() {
          const id = d3.select(this).attr("data-id");
          select(id);
        });
      });
    }

    // --- Render links ---
    const links = model.links || [];
    const linkGroup = g.append("g").attr("class", "links");
    for (const l of links) {
      const s = elPositions.get(l.from);
      const t = elPositions.get(l.to);
      if (!s || !t) continue;

      const sx = s.x + s.width;
      const sy = s.y + s.height / 2;
      const tx = t.x;
      const ty = t.y + t.height / 2;
      const dx = tx - sx;
      const curve = Math.min(60, Math.abs(dx) / 2);
      const pathD = `M ${sx} ${sy} C ${sx + curve} ${sy} ${tx - curve} ${ty} ${tx} ${ty}`;

      const linkStyle = getStyle(model, "link", l.label);

      linkGroup.append("path")
        .attr("d", pathD)
        .attr("fill", "none")
        .attr("stroke", linkStyle.color ?? "#000")
        .attr("stroke-width", linkStyle.width ?? 2)
        .attr("stroke-linecap", "round")
        .attr("marker-end", "url(#arrow)")
        .attr("opacity", 0.7)
        .attr("stroke-dasharray", linkStyle.style === "dashed" ? "6,3" : null)
        .attr("data-id", l.id)
        .attr("data-from", l.from)
        .attr("data-to", l.to);

      if (l.label) {
        const mx = (sx + tx) / 2;
        const my = (sy + ty) / 2 - 10;
        linkGroup.append("text")
          .attr("x", mx)
          .attr("y", my)
          .attr("fill", "#222")
          .attr("font-size", 24)
          .attr("text-anchor", "middle")
          .text(l.label);
      }
    }
  }, [model, select]);
}
