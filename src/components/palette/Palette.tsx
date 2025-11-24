import React, { useState } from "react";
import { useStore } from "../../store/store";

export default function Palette({ onlyAdd = false, onAdd }: { onlyAdd?: boolean; onAdd?: () => void }) {
  const addComponent = useStore((s) => s.addComponent);
  const componentTypes = useStore((s) => s.componentTypes);
  const [name, setName] = useState("new-service");
  const [type, setType] = useState(componentTypes[0] ?? "microservice");
  const [level, setLevel] = useState(1);
  const [column, setColumn] = useState(1);

  const doAdd = () => {
    addComponent({
      name,
      type,
      level: Number(level),
      column: Number(column),
      elements: []
    });
    setName("new-service");
    if (onAdd) onAdd();
  };

  return (
    <div style={{ padding: 12 }}>
      <h3>Palette</h3>
      <div style={{ display: "grid", gap: 8 }}>
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          Type
          <select value={type} onChange={(e) => setType(e.target.value)}>
            {componentTypes.map((type: string) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </label>
        <label>
          Level
          <input type="number" min={1} value={level} onChange={(e) => setLevel(Number(e.target.value))} />
        </label>
        <label>
          Column
          <input type="number" min={1} value={column} onChange={(e) => setColumn(Number(e.target.value))} />
        </label>
        <div>
          <button onClick={doAdd}>Add component</button>
        </div>
      </div>
    </div>
  );
}
