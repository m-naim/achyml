import React, { useEffect, useState, useRef } from "react";
import { useStore } from "../../store/store";
import { setupYamlMonacoSchema } from "../../utils/yamlMonaco";
import YamlEditorToolbar from "./YamlEditorToolbar";
import YamlMonacoEditor from "./YamlMonacoEditor";


export default function YamlEditor() {
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
  }, [text]);

  // Actions
  const apply = () => {
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
      />
      {msg && <div style={{ marginTop: 8, color: "crimson" }}>{msg}</div>}
      <YamlMonacoEditor
        value={text}
        schema={schema}
        onChange={onEditorChange}
      />
    </div>
  );
}
