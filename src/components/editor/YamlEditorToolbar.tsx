import React from "react";

export default function YamlEditorToolbar({
  onApply,
  onExport,
  onImport,
  useLocalFile,
  onToggleLocalFile,
  dirSyncActive,
}: {
  onApply: () => void;
  onExport: () => void;
  onImport: () => void;
  useLocalFile: boolean;
  onToggleLocalFile: (val: boolean) => void;
  dirSyncActive: boolean;
}) {
  const isDisabled = useLocalFile || dirSyncActive;

  return (
    <div className="yaml-editor-toolbar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onApply} disabled={isDisabled} title={isDisabled ? "Disabled in Sync mode" : undefined}>Apply YAML</button>
        <button onClick={onExport}>Export YAML</button>
        <button onClick={() => onImport()} disabled={isDisabled}>Import YAML/JSON</button>
      </div>
      <label style={{ 
        display: "flex", 
        alignItems: "center", 
        gap: 6, 
        fontSize: 12, 
        color: "#e3f2fd", 
        cursor: dirSyncActive ? "not-allowed" : "pointer", 
        userSelect: "none",
        opacity: dirSyncActive ? 0.5 : 1
      }}>
        <input
          type="checkbox"
          checked={useLocalFile}
          disabled={dirSyncActive}
          onChange={(e) => onToggleLocalFile(e.target.checked)}
          style={{ cursor: dirSyncActive ? "not-allowed" : "pointer" }}
        />
        <span>Sync with <code>public/sample.yaml</code></span>
      </label>
    </div>
  );
}
