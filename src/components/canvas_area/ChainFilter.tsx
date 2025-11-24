import React, { useMemo, useState } from "react";
import { useStore } from "../../store/store";
import { applyChainFilter, calculateChainForComponent } from "../../utils/chainFilterUtils";
import type { ComponentItem, LinkItem } from "../../types";

// Helper to get all upstream and downstream element ids from a start id
function getChainIds(startId: string, links: LinkItem[]) {
  const upstream = new Set<string>();
  const downstream = new Set<string>();
  const visitedUp = new Set<string>();
  const visitedDown = new Set<string>();

  function walkUp(id: string) {
    if (visitedUp.has(id)) return;
    visitedUp.add(id);
    for (const l of links) {
      if (l.to === id) {
        upstream.add(l.from);
        walkUp(l.from);
      }
    }
  }

  function walkDown(id: string) {
    if (visitedDown.has(id)) return;
    visitedDown.add(id);
    for (const l of links) {
      if (l.from === id) {
        downstream.add(l.to);
        walkDown(l.to);
      }
    }
  }

  walkUp(startId);
  walkDown(startId);

  return {
    elementIds: [startId, ...Array.from(upstream), ...Array.from(downstream)],
    linkIds: links
      .filter(l =>
        l.from === startId ||
        l.to === startId ||
        upstream.has(l.from) ||
        downstream.has(l.to)
      )
      .map(l => l.id)
  };
}

export default function ChainFilter({ onFilter }: { onFilter: (filter: { active: boolean; elementIds: string[]; linkIds: string[] }) => void }) {
  const model = useStore((s) => s.model);
  const selectedId = useStore((s) => s.selectedId);
  const [active, setActive] = useState(false);

  // Determine if selectedId is a component or element
  const comp = model.components.find((c: any) => c.id === selectedId);
  const isComponent = !!comp;

  // Use shared logic for chain calculation
  const { elementIds, linkIds } = useMemo(() => {
    if (!active || !selectedId) return { elementIds: [], linkIds: [] };
    if (isComponent) {
      // Use shared utility for component chain
      return calculateChainForComponent(model, selectedId);
    }
    // Fallback to element chain
    return getChainIds(selectedId, model.links || []);
  }, [active, selectedId, model.links, model.components]);

  React.useEffect(() => {
    onFilter({ active, elementIds, linkIds });
  }, [active, elementIds, linkIds]);

  return (
    <div className="chain-filter">
      <h4 className="chain-filter-title">Chain Filter</h4>
      <div className="chain-filter-controls">
        <span className="chain-filter-label">Selected ID:</span>
        <span className="chain-filter-selected">
          {selectedId || <span className="chain-filter-none">none</span>}
        </span>
        <button
          className="chain-filter-btn chain-filter-show"
          onClick={() => setActive(true)}
          disabled={active || !selectedId}
        >
          Show chain
        </button>
        <button
          className="chain-filter-btn chain-filter-disable"
          onClick={() => setActive(false)}
          disabled={!active}
        >
          Disable filter
        </button>
      </div>
    </div>
  );
}
