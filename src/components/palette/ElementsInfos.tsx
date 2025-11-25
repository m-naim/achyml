import React, { useState } from "react";
import { useStore } from "../../store/store";
import { Model } from "../../types";

export default function ElementsInfos({ el , parentComp}: any) {
  const model = useStore<Model>((s) => s.model);
  const select = useStore((s) => s.select);
  // Dependency adder states
  const [showDepAdder, setShowDepAdder] = useState(false);
  const [depCompSearch, setDepCompSearch] = useState("");
  const [depCompId, setDepCompId] = useState<string>("");
  const [depElemId, setDepElemId] = useState<string>("");
  const updateElement = useStore((s) => s.updateElement);

  // Add dependency handler
  const handleAddDependency = () => {
    if (!depCompId || !depElemId) return;
    updateElement(el.id, {
      dependencies: [...(el.dependencies ?? []), { to: depElemId }],
    });
    setShowDepAdder(false);
    setDepCompSearch("");
    setDepCompId("");
    setDepElemId("");
  };


  return (
    <div style={{ padding: 12 }}>
                <div>
          {!showDepAdder ? (
            <button onClick={() => setShowDepAdder(true)}>
              Add Dependency
            </button>
          ) : (
            <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
              <label>
                Search Component
                <input
                  type="text"
                  placeholder="Type to filter..."
                  value={depCompSearch}
                  onChange={(e) => setDepCompSearch(e.target.value)}
                  list="dep-comp-list"
                />
                <datalist id="dep-comp-list">
                  {model.components
                    .filter((c) =>
                      c.name?.toLowerCase().includes(depCompSearch.toLowerCase())
                    )
                    .map((c) => (
                      <option key={c.id} value={c.name} />
                    ))}
                </datalist>
              </label>
              <label>
                Select Component
                <select
                  value={depCompId}
                  onChange={(e) => setDepCompId(e.target.value)}
                >
                  <option value="">--Choose component--</option>
                  {model.components
                    .filter((c) =>
                      c.name?.toLowerCase().includes(depCompSearch.toLowerCase())
                    )
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </label>
              {depCompId && (
                <label>
                  Select Element
                  <select
                    value={depElemId}
                    onChange={(e) => setDepElemId(e.target.value)}
                  >
                    <option value="">--Choose element--</option>
                    {(
                      model.components.find((c) => c.id === depCompId)
                        ?.elements || []
                    ).map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.type === "route" ? e.method + " " + e.path : e.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <div>
                <button
                  disabled={!depCompId || !depElemId}
                  onClick={handleAddDependency}
                >
                  Add Dependency
                </button>
                <button
                  onClick={() => {
                    setShowDepAdder(false);
                    setDepCompSearch("");
                    setDepCompId("");
                    setDepElemId("");
                  }}
                  style={{ marginLeft: 8 }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => select(null)}>Deselect</button>
        </div>
      <h4>Element Properties</h4>
      <div style={{ display: "grid", gap: 8 }}>
        <label>
          ID
          <input value={el.id} />
        </label>
        <label>
          Name
          <input value={el.name ?? ""} />
        </label>
        <label>
          Type
          <input value={el.type ?? ""} />
        </label>
        <label>
          Method
          <input value={el.method ?? ""} />
        </label>
        <label>
          Path
          <input value={el.path ?? ""} />
        </label>
        <label>
          Description
          <input value={el.description ?? ""} />
        </label>
        <label>
          Parent Component
          <input value={parentComp?.name ?? parentComp?.id ?? ""} />
        </label>
        <label>
          Dependencies
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {(el.dependencies ?? []).map((dep: any, idx: number) => {
              // Find the target element and its parent component for display
              let targetComp = null, targetElem = null;
              for (const comp of model.components) {
                targetElem = (comp.elements || []).find(e => e.id === dep.to);
                if (targetElem) {
                  targetComp = comp;
                  break;
                }
              }
              return (
                <div key={dep.to} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, background: "#e3f2fd", borderRadius: 4, padding: "2px 8px" }}>
                  <span>
                    {targetComp ? `${targetComp.name} ` : ""}
                    {targetElem ? targetElem.name : dep.to}
                  </span>
                  <button
                    style={{ background: "#f44336", color: "#fff", border: "none", borderRadius: 4, padding: "2px 8px", fontSize: 12, cursor: "pointer" }}
                    onClick={() => {
                      // Remove this dependency
                      const newDeps = (el.dependencies ?? []).filter((d: any) => d.to !== dep.to);
                      updateElement(el.id, { dependencies: newDeps });
                    }}
                  >
                    Delete
                  </button>
                </div>
              );
            })}
            {(!el.dependencies || el.dependencies.length === 0) && (
              <span style={{ color: "#aaa", fontSize: 12 }}>No dependencies</span>
            )}
          </div>
        </label>


      </div>
    </div>
  );
}
