import * as d3 from "d3";
import { Model, LinkItem } from "../../../types";
import { getStyle } from "../../../utils/d3Style";

export function renderLinks(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  model: Model,
  elPositions: Map<string, any>
) {
  const links: LinkItem[] = model.links || [];
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
  return linkGroup;
}
