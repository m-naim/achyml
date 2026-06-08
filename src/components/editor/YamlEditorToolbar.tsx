import React from "react";

export default function YamlEditorToolbar({
  onApply,
  onExport,
  onImport,
  useLocalFile,
  onToggleLocalFile,
  localFileTarget,
  onChangeLocalFileTarget,
  dirSyncActive,
}: {
  onApply: () => void;
  onExport: () => void;
  onImport: () => void;
  useLocalFile: boolean;
  onToggleLocalFile: (val: boolean) => void;
  localFileTarget: string;
  onChangeLocalFileTarget: (val: string) => void;
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
      
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        gap: 8, 
        fontSize: 12, 
        color: "#e3f2fd", 
        opacity: dirSyncActive ? 0.5 : 1,
        pointerEvents: dirSyncActive ? "none" : "auto"
      }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", userSelect: "none" }}>
          <input
            type="checkbox"
            checked={useLocalFile}
            onChange={(e) => onToggleLocalFile(e.target.checked)}
            style={{ cursor: "pointer" }}
          />
          <span>Sync with:</span>
        </label>
        {useLocalFile && (
          <select
            value={localFileTarget}
            onChange={(e) => onChangeLocalFileTarget(e.target.value)}
            style={{
              padding: "4px 8px",
              fontSize: 11,
              background: "#0f172a",
              color: "#90caf9",
              border: "1px solid rgba(144, 202, 249, 0.3)",
              borderRadius: 6,
              outline: "none",
              cursor: "pointer"
            }}
          >
            <option value="sample.yaml">Complexe E-commerce (sample.yaml)</option>
            <option value="main-bundled.yaml">Modulaire / Multi-fichiers (main-bundled.yaml)</option>
          </select>
        )}
      </div>
    </div>
  );
}
