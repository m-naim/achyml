import React from "react";

export default function YamlEditorToolbar({
  onApply,
  onExport,
  onImport,
  useLocalFile,
  onToggleLocalFile,
}: {
  onApply: () => void;
  onExport: () => void;
  onImport: () => void;
  useLocalFile: boolean;
  onToggleLocalFile: (val: boolean) => void;
}) {
  return (
    <div className="yaml-editor-toolbar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onApply} disabled={useLocalFile} title={useLocalFile ? "Disabled in Local Sync mode" : undefined}>Apply YAML</button>
        <button onClick={onExport}>Export YAML</button>
        <button onClick={() => onImport()} disabled={useLocalFile}>Import YAML/JSON</button>
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#e3f2fd", cursor: "pointer", userSelect: "none" }}>
        <input
          type="checkbox"
          checked={useLocalFile}
          onChange={(e) => onToggleLocalFile(e.target.checked)}
          style={{ cursor: "pointer" }}
        />
        <span>Sync with <code>public/sample.yaml</code></span>
      </label>
    </div>
  );
}
