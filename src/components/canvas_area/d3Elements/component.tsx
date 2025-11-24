import { Model } from "../../../types";
import { getStyle } from "../../../utils/d3Style";
import * as d3 from "d3";


export function renderComponents(
    g: d3.Selection<SVGGElement, unknown, null, undefined>, 
    model: Model, 
    compPositions: Map<string, any>,
 select: (id?: string | null) => void
) {
  const compGroup = g.append("g").attr("class", "components");
  for (const comp of model.components || []) {
    const pos = compPositions.get(comp.id)!;
    const elementsCount = comp.elements?.length ?? 0;
    const compHeight = Math.max(
      240,
      elementsCount * (40 + 24) + 32 * 3 
    );
    const compStyle = getStyle(model, "component", comp.type);

    const gx = compGroup.append("g").attr("transform", `translate(${pos.x},${pos.y})`)
    .attr("data-id", comp.id);

    gx.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("rx", compStyle.borderRadius ?? 20)
      .attr("ry", compStyle.borderRadius ?? 20)
      .attr("width", 320)
      .attr("height", compHeight)
      .attr("fill", compStyle.background ?? "#fff")
      .attr("stroke", compStyle.border ?? "#000")
      .attr("cursor", "pointer")
      .attr("stroke-width", 1)
    .on('mouseover', function (d, i) {
          d3.select(this).transition()
               .duration(50)
               .attr('opacity', '.85');     
    })
    .on('mouseout', function (d, i) {
          d3.select(this).transition()
               .duration(50)
               .attr('opacity', '1');
    });

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

    gx
    .on("mouseenter", function() {
            const id = d3.select(this).attr("data-id");
            gx.selectAll("path")
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
    
    .on("click", function() {
            const id = d3.select(this).attr("data-id");
            console.log("select", id);
            select(id);
          });
  }
}