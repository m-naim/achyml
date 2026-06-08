import React, { useEffect, useState, useRef } from "react";
import { useStore } from "../../store/store";
import { setupYamlMonacoSchema } from "../../utils/yamlMonaco";
import YamlEditorToolbar from "./YamlEditorToolbar";
import YamlMonacoEditor from "./YamlMonacoEditor";


export default function YamlEditor({ useLocalFile, onToggleLocalFile }: {
  useLocalFile: boolean;
  onToggleLocalFile: (val: boolean) => void;
}) {
  const store = useStore();
  const [text, setText] = useState(store.toYaml());
  const [msg, setMsg] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const [schema, setSchema] = useState<any | null>(null);
  const [styleConfig, setStyleConfig] = useState<any>({});

  // Initialisation du YAML et du schéma
  useEffect(() => {
    setText(store.toYaml());
  }, [store.model]);

  useEffect(() => {
    fetch("/yaml-schema.json")
      .then((res) => res.json())
      .then((json) => {
        setSchema(json);
        setupYamlMonacoSchema(json);
      });
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  // Keyboard shortcut: Ctrl+S / Cmd+S to save/apply YAML
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (useLocalFile) return; // ignore save shortcut in sync mode
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "s" || e.key === "S")
      ) {
        e.preventDefault();
        apply();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [text, useLocalFile]);

  // Actions
  const apply = () => {
    if (useLocalFile) return;
    const res = store.setModelFromYaml(text);
    if (!res.ok) {
      setMsg("Erreur YAML: " + (res.error ?? "unknown"));
    } else {
      setMsg("YAML appliqué");
      setTimeout(() => setMsg(null), 2000);
    }
  };

  const exportYaml = () => {
    const blob = new Blob([store.toYaml()], { type: "text/yaml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "schema.yaml";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importFile = async (f?: File) => {
    if (useLocalFile) return;
    try {
      let file = f;
      if (!file) {
        const el = document.createElement("input");
        el.type = "file";
        el.accept = ".yaml,.yml,.json";
        el.onchange = () => {
          if (el.files && el.files[0]) {
            importFile(el.files![0]);
          }
        };
        el.click();
        return;
      }
      const content = await file.text();
      if (file.name.endsWith(".json")) {
        const json = JSON.parse(content);
        store.setModel(json);
      } else {
        store.setModelFromYaml(content);
      }
    } catch (e: any) {
      setMsg("Import error: " + (e.message ?? String(e)));
    }
  };

  const onEditorChange = (v: string | undefined) => {
    setText(v ?? "");
  };

  return (
    <div className="yaml-editor-container">
      <YamlEditorToolbar
        onApply={apply}
        onExport={exportYaml}
        onImport={importFile}
        useLocalFile={useLocalFile}
        onToggleLocalFile={onToggleLocalFile}
      />
      {useLocalFile && (
        <div style={{ padding: "8px 12px", margin: "8px 0", background: "rgba(25, 118, 210, 0.15)", borderRadius: 8, fontSize: 12, color: "#90caf9", border: "1px solid rgba(25, 118, 210, 0.3)", lineHeight: "1.5" }}>
          🔄 <b>Local File Sync Active</b><br />
          Edits made in this web editor are temporary. Edit the file directly in your local text editor (e.g. VS Code) at <code>public/sample.yaml</code>. The browser will auto-reload when you save!
        </div>
      )}
      {msg && <div style={{ marginTop: 8, color: "crimson" }}>{msg}</div>}
      <YamlMonacoEditor
        value={text}
        schema={schema}
        onChange={onEditorChange}
      />
    </div>
  );
}
