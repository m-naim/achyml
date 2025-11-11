import React, { useMemo, useState } from "react";
import { useStore } from "../store";
import type { ComponentItem, LinkItem } from "../types";

// Helper to get all upstream and downstream element ids from a start id
function getChainIds(startId: string, links: LinkItem[]) {
  const upstream = new Set<string>();
  const downstream = new Set<string>();
  const visitedUp = new Set<string>();
  const visitedDown = new Set<string>();

  // Upstream: recursively follow links where to == current
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

  // Downstream: recursively follow links where from == current
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

  // Always include startId
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

  const { elementIds, linkIds } = useMemo(() => {
    if (!active || !selectedId) return { elementIds: [], linkIds: [] };
    return getChainIds(selectedId, model.links || []);
  }, [active, selectedId, model.links]);

  // Notify parent (App) when filter changes
  React.useEffect(() => {
    onFilter({ active, elementIds, linkIds });
  }, [active, elementIds, linkIds, onFilter]);

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
