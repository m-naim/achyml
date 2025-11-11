import React from "react";
import Editor from "@monaco-editor/react";
import { setupYamlMonacoSchema } from "../utils/yamlMonaco";

export default function YamlMonacoEditor({ value, schema, onChange }: {
  value: string;
  schema: any;
  onChange: (v: string | undefined) => void;
}) {
  return (
    <div style={{ flex: 1, minHeight: 0 }}>
      <Editor
        height="100%"
        defaultLanguage="yaml"
        language="yaml"
        value={value}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          wordWrap: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
        }}
        onMount={(editor, monaco) => {
          if (monaco.languages?.yaml && schema) {
            setupYamlMonacoSchema(schema);
          }
        }}
        onChange={onChange}
      />
    </div>
  );
}
