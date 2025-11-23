import React from "react";
import { useStore } from "../../store/store";

export default function ComponentInfos({ comp }: any) {
  const updateComponent = useStore((s) => s.updateComponent);
  const removeComponent = useStore((s) => s.removeComponent);
  const select = useStore((s) => s.select);
  
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
          <input
            value={comp.name ?? ""}
            onChange={(e) => updateComponent(comp.id, { name: e.target.value })}
          />
        </label>
        <label>
          Type
          <select
            value={comp.type ?? ""}
            onChange={(e) => updateComponent(comp.id, { type: e.target.value })}
          >
            <option value="microservice">microservice</option>
            <option value="mongodb">mongodb</option>
            <option value="sql">database-sql</option>
            <option value="api-gateway">api-gateway</option>
            <option value="queue">queue</option>
            <option value="cache">cache</option>
            <option value="mainframe">mainframe</option>
            <option value="external">external-api</option>
          </select>
        </label>
        <label>
          Level
          <input
            type="number"
            value={comp.level ?? 1}
            onChange={(e) =>
              updateComponent(comp.id, { level: Number(e.target.value) })
            }
          />
        </label>
        <label>
          Column
          <input
            type="number"
            value={comp.column ?? 1}
            onChange={(e) =>
              updateComponent(comp.id, { column: Number(e.target.value) })
            }
          />
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={!!comp.collapsed}
            onChange={(e) =>
              updateComponent(comp.id, { collapsed: e.target.checked })
            }
          />
          Collapsed
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => {
              removeComponent(comp.id);
            }}
          >
            Delete
          </button>
          <button onClick={() => select(null)}>Deselect</button>
        </div>
      </div>
    </div>
  );
}
