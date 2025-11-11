import React from "react";
import { useStore } from "../store";

export default function Properties() {
  const selectedId = useStore((s) => s.selectedId);
  const model = useStore((s) => s.model);
  const updateComponent = useStore((s) => s.updateComponent);
  const removeComponent = useStore((s) => s.removeComponent);
  const select = useStore((s) => s.select);

  // Find selected component or element
  const comp = model.components.find((c) => c.id === selectedId);
  let el = null;
  let parentComp = null;
  if (!comp && selectedId) {
    for (const c of model.components) {
      el = (c.elements || []).find((e) => e.id === selectedId);
      if (el) {
        parentComp = c;
        break;
      }
    }
  }

  if (!selectedId) {
    return (
      <div style={{ padding: 12 }}>
        <h4>Properties</h4>
        <div style={{ color: "#666" }}>No selection</div>
      </div>
    );
  }

  if (comp) {
    return (
      <div style={{ padding: 12 }}>
        <h4>Component Properties</h4>
        <div style={{ display: "grid", gap: 8 }}>
          <label>
            ID
            <input value={comp.id} readOnly />
          </label>
          <label>
            Name
            <input value={comp.name ?? ""} onChange={(e) => updateComponent(comp.id, { name: e.target.value })} />
          </label>
          <label>
            Type
            <input value={comp.type ?? ""} onChange={(e) => updateComponent(comp.id, { type: e.target.value })} />
          </label>
          <label>
            Level
            <input type="number" value={comp.level ?? 1} onChange={(e) => updateComponent(comp.id, { level: Number(e.target.value) })} />
          </label>
          <label>
            Column
            <input type="number" value={comp.column ?? 1} onChange={(e) => updateComponent(comp.id, { column: Number(e.target.value) })} />
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" checked={!!comp.collapsed} onChange={(e) => updateComponent(comp.id, { collapsed: e.target.checked })} />
            Collapsed
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { removeComponent(comp.id); }}>Delete</button>
            <button onClick={() => select(null)}>Deselect</button>
          </div>
        </div>
      </div>
    );
  }

  if (el) {
    return (
      <div style={{ padding: 12 }}>
        <h4>Element Properties</h4>
        <div style={{ display: "grid", gap: 8 }}>
          <label>
            ID
            <input value={el.id} readOnly />
          </label>
          <label>
            Name
            <input value={el.name ?? ""} readOnly />
          </label>
          <label>
            Type
            <input value={el.type ?? ""} readOnly />
          </label>
          <label>
            Method
            <input value={el.method ?? ""} readOnly />
          </label>
          <label>
            Path
            <input value={el.path ?? ""} readOnly />
          </label>
          <label>
            Description
            <input value={el.description ?? ""} readOnly />
          </label>
          <label>
            Parent Component
            <input value={parentComp?.name ?? parentComp?.id ?? ""} readOnly />
          </label>
          <label>
            Dependencies
            <textarea value={JSON.stringify(el.dependencies ?? [], null, 2)} readOnly style={{ minHeight: 40 }} />
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => select(null)}>Deselect</button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
