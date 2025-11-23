import * as d3 from "d3";
import { Model } from "../../../types";
import { getStyle } from "../../../utils/d3Style";

export function renderElements(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  model: Model,
  elPositions: Map<string, any>,
  linkGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  select: (id?: string | null) => void
) {
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
          .attr("stroke", function() {
            const p = d3.select(this);
            return (p.attr("data-from") === id || p.attr("data-to") === id) 
              ? "#0984e3" 
              : "#2c3e50";
          })
          .attr("stroke-width", function() {
            const p = d3.select(this);
            return (p.attr("data-from") === id || p.attr("data-to") === id) 
              ? 3 
              : 2;
          })
          .attr("opacity", function() {
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
}
