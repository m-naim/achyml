import React, { useEffect, useMemo, useState } from "react";
import { useStore } from "../../store/store";
import { calculateChainForComponent } from "../../utils/chainFilterUtils";
import { LinkItem } from "../../types";
import { Link2, Plus, X, Search } from "lucide-react";
import "./ActionBar.css"; // <-- import the new CSS file

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
  const select = useStore((s) => s.select);
  const [active, setActive] = useState(false);

  // Search state for ActionBar
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

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

  // Search handler: filter components and elements by name/id/path/method
  useEffect(() => {
    if (!searchTerm) {
      setSearchResults([]);
      return;
    }
    const results: any[] = [];
    for (const comp of model.components || []) {
      if (
        comp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comp.id?.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        results.push({ type: "component", id: comp.id, name: comp.name });
      }
      for (const el of comp.elements || []) {
        if (
          el.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          el.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          el.path?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          el.method?.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          results.push({
            type: "element",
            id: el.id,
            name: el.name ?? el.path ?? el.id,
            parentComp: comp.id,
          });
        }
      }
    }
    setSearchResults(results);
  }, [searchTerm, model]);

  // Select and zoom handler
  const handleSearchSelect = (item: any) => {
    select(item.id);
    setSearchTerm("");
    setSearchResults([]);
    // Optionally, trigger zoom/focus logic here (e.g., center D3 view on item)
  };

  const handleChainFilterClick = () => {
    const newActive = !active;
    setActive(newActive);
    onChainFilter({ active: newActive, elementIds: [], linkIds: [] });
  };
  return (
    <div className="action-bar">
      <div className="action-bar-search">
        <Search size={18} className="action-bar-search-icon" />
        <input
          type="text"
          className="action-bar-search-input"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchResults.length > 0 && (
          <div className="action-bar-search-results">
            {searchResults.map((item, idx) => (
              <div
                key={item.id + idx}
                className={`action-bar-search-result${
                  idx % 2 === 0 ? " even" : ""
                }`}
                onClick={() => handleSearchSelect(item)}
              >
                {item.type === "component" ? (
                  <b>🧩 {item.name}</b>
                ) : (
                  <>
                    <span>🔹 {item.name}</span>
                    <span className="action-bar-search-result-parent">
                      ({item.parentComp})
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <span className="action-bar-sep">|</span>
      <button
        title="Show chain filter (C)"
        className={`action-bar-btn${
          chainFilterActive ? " active" : ""
        }`}
        onClick={handleChainFilterClick}
        disabled={!selectedId}
      >
        <Link2 size={22} />
      </button>
      <span className="action-bar-sep">|</span>
      <button
        title="Add component (A)"
        className="action-bar-btn"
        onClick={onAddComponent}
      >
        <Plus size={22} />
      </button>
      {selectedId && (
        <>
          <span className="action-bar-sep">|</span>
          <span className="action-bar-selected">
            <span className="action-bar-selected-id">{selectedId}</span>
            <button
              title="Deselect"
              className="action-bar-deselect-btn"
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
