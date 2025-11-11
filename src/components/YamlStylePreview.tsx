import React from "react";
import { extractStyleFromYaml } from "../utils/yamlStyle";

export default function YamlStylePreview({ yamlText }: { yamlText: string }) {
  const styleConfig = extractStyleFromYaml(yamlText);
  return (
    <div style={{ marginTop: 12, fontSize: 13, color: "#666" }}>
      <strong>Style YAML appliqué :</strong>
      <pre style={{ background: "#f6f8fa", padding: 8, borderRadius: 6, maxHeight: 120, overflow: "auto" }}>
        {JSON.stringify(styleConfig, null, 2)}
      </pre>
    </div>
  );
}
