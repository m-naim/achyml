import React, { useEffect, useMemo, useState } from "react";
import { useStore } from "../../store/store";
import { calculateChainForComponent } from "../../utils/chainFilterUtils";
import { LinkItem } from "../../types";
import { Link2, Plus, X } from "lucide-react";

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
      .filter(
        (l) =>
          l.from === startId ||
          l.to === startId ||
          upstream.has(l.from) ||
          downstream.has(l.to)
      )
      .map((l) => l.id),
  };
}

export default function ActionBar({
  onChainFilter,
  onAddComponent,
  chainFilterActive,
  selectedId,
  onDeselect,
}: {
  onChainFilter: (filter: {
    active: boolean;
    elementIds: string[];
    linkIds: string[];
  }) => void;
  onAddComponent: () => void;
  chainFilterActive: boolean;
  selectedId?: string | null;
  onDeselect?: () => void;
}) {
  const model = useStore((s) => s.model);
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

  useEffect(() => {
    onChainFilter({ active, elementIds, linkIds });
  }, [active, elementIds, linkIds]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.key === "c" || e.key === "C") && selectedId) {
        handleChainFilterClick();
      }
      if (e.key === "a" || e.key === "A") {
        onAddComponent();
      }
      if ((e.key === "Escape" || e.key === "Esc") && selectedId && onDeselect) {
        onDeselect();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedId, active, onAddComponent, onDeselect]);

  const handleChainFilterClick = () => {
    const newActive = !active;
    setActive(newActive);
    onChainFilter({ active: newActive, elementIds: [], linkIds: [] });
  };
  return (
    <div className="action-bar">
      <button
        title="Show chain filter (C)"
        style={{
          background: chainFilterActive ? "#1976d2" : "#e3f2fd",
          color: chainFilterActive ? "#fff" : "#1976d2",
          border: "none",
          borderRadius: 6,
          padding: "6px 14px",
          fontWeight: 600,
          fontSize: 18,
          cursor: selectedId ? "pointer" : "not-allowed",
          opacity: selectedId ? 1 : 0.6,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onClick={handleChainFilterClick}
        disabled={!selectedId}
      >
        <Link2 size={22} />
      </button>
      <span className="action-bar-sep">|</span>
      <button
        title="Add component (A)"
        style={{
          color: "#fff",
          border: "none",
          borderRadius: 6,
          padding: "6px 14px",
          fontWeight: 600,
          fontSize: 18,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onClick={onAddComponent}
      >
        <Plus size={22} />
      </button>
      {selectedId && (
        <>
          <span className="action-bar-sep">|</span>
          <span
            style={{
              color: "#e3f2fd",
              fontSize: 14,
              fontWeight: 600,
              background: "rgba(25,118,210,0.12)",
              borderRadius: 6,
              padding: "2px 10px",
              marginLeft: 2,
              marginRight: 2,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {selectedId}
            <button
              title="Deselect"
              style={{
                background: "transparent",
                color: "#90caf9",
                border: "none",
                fontSize: 18,
                marginLeft: 6,
                cursor: "pointer",
                padding: 0,
                display: "flex",
                alignItems: "center",
              }}
              onClick={onDeselect}
            >
              <X size={18} />
            </button>
          </span>
        </>
      )}
    </div>
  );
}
