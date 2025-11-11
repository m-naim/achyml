import React from "react";

export default function YamlEditorToolbar({ onApply, onExport, onImport }: {
  onApply: () => void;
  onExport: () => void;
  onImport: () => void;
}) {
  return (
    <div className="yaml-editor-toolbar">
      <button onClick={onApply}>Apply YAML</button>
      <button onClick={onExport}>Export YAML</button>
      <button onClick={() => onImport()}>Import YAML/JSON</button>
    </div>
  );
}
