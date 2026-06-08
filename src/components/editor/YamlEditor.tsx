import React, { useEffect, useState, useRef } from "react";
import { useStore } from "../../store/store";
import { setupYamlMonacoSchema } from "../../utils/yamlMonaco";
import YamlEditorToolbar from "./YamlEditorToolbar";
import YamlMonacoEditor from "./YamlMonacoEditor";

async function scanDirectory(dirHandle: any): Promise<Array<{ name: string; handle: any }>> {
  const list: Array<{ name: string; handle: any }> = [];
  
  async function scan(handle: any, path = "") {
    for await (const entry of handle.values()) {
      if (entry.kind === "file") {
        if (entry.name.endsWith(".yaml") || entry.name.endsWith(".yml") || entry.name.endsWith(".json")) {
          list.push({
            name: path ? `${path}/${entry.name}` : entry.name,
            handle: entry
          });
        }
      } else if (entry.kind === "directory") {
        try {
          await scan(entry, path ? `${path}/${entry.name}` : entry.name);
        } catch (e) {
          console.warn("Failed to read subdirectory", entry.name, e);
        }
      }
    }
  }

  await scan(dirHandle);
  list.sort((a, b) => a.name.localeCompare(b.name));
  return list;
}

export default function YamlEditor({ useLocalFile, onToggleLocalFile }: {
  useLocalFile: boolean;
  onToggleLocalFile: (val: boolean) => void;
}) {
  const store = useStore();
  const [text, setText] = useState(store.toYaml());
  const [msg, setMsg] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const [schema, setSchema] = useState<any | null>(null);

  // Local Directory Sync States
  const [dirHandle, setDirHandle] = useState<any>(null);
  const [filesList, setFilesList] = useState<Array<{ name: string; handle: any }>>([]);
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [selectedFileHandle, setSelectedFileHandle] = useState<any>(null);
  const [dirName, setDirName] = useState<string>("");
  const [autoPoll, setAutoPoll] = useState<boolean>(true);

  const isDirectoryPickerSupported = typeof (window as any).showDirectoryPicker === "function";

  const openDirectory = async () => {
    if (!isDirectoryPickerSupported) {
      alert("Your browser does not support the File System Access API. Please use Chrome or Edge.");
      return;
    }
    try {
      const handle = await (window as any).showDirectoryPicker();
      setDirHandle(handle);
      setDirName(handle.name);
      const list = await scanDirectory(handle);
      setFilesList(list);
      setSelectedFileName("");
      setSelectedFileHandle(null);
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setMsg("Error opening folder: " + err.message);
      }
    }
  };

  const refreshDirectory = async () => {
    if (!dirHandle) return;
    try {
      const list = await scanDirectory(dirHandle);
      setFilesList(list);
      setMsg("Files list refreshed");
      setTimeout(() => setMsg(null), 1500);
    } catch (err: any) {
      setMsg("Refresh error: " + err.message);
    }
  };

  const handleFileSelect = async (fileName: string) => {
    setSelectedFileName(fileName);
    if (!fileName) {
      setSelectedFileHandle(null);
      return;
    }
    const item = filesList.find(f => f.name === fileName);
    if (!item) return;

    setSelectedFileHandle(item.handle);
    try {
      const file = await item.handle.getFile();
      const text = await file.text();
      let res;
      if (fileName.endsWith(".json")) {
        try {
          const json = JSON.parse(text);
          store.setModel(json);
          res = { ok: true };
        } catch (e: any) {
          res = { ok: false, error: e.message };
        }
      } else {
        res = store.setModelFromYaml(text);
      }
      if (!res.ok) {
        setMsg(`Error loading ${fileName}: ${res.error}`);
      } else {
        setMsg(`Loaded ${fileName}`);
        setTimeout(() => setMsg(null), 2000);
      }
    } catch (err: any) {
      setMsg(`Error reading file: ${err.message}`);
    }
  };

  // Auto-polling for local directory file sync
  useEffect(() => {
    if (!selectedFileHandle || !autoPoll) return;
    let active = true;
    let lastModified = 0;

    selectedFileHandle.getFile().then((file: any) => {
      lastModified = file.lastModified;
    });

    const checkFile = async () => {
      try {
        const file = await selectedFileHandle.getFile();
        if (file.lastModified !== lastModified) {
          lastModified = file.lastModified;
          const text = await file.text();
          let res;
          if (selectedFileName.endsWith(".json")) {
            try {
              const json = JSON.parse(text);
              store.setModel(json);
              res = { ok: true };
            } catch (e: any) {
              res = { ok: false, error: e.message };
            }
          } else {
            res = store.setModelFromYaml(text);
          }
          if (!res.ok) {
            setMsg(`Auto-sync error: ${res.error}`);
          } else {
            setMsg(`Auto-synced ${selectedFileName}`);
            setTimeout(() => setMsg(null), 1500);
          }
        }
      } catch (err: any) {
        console.error("Auto-sync file check failed", err);
      }
    };

    const interval = setInterval(() => {
      if (active) checkFile();
    }, 1000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [selectedFileHandle, autoPoll, selectedFileName]);

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
      if (useLocalFile || selectedFileHandle) return; // ignore save shortcut in sync modes
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
  }, [text, useLocalFile, selectedFileHandle]);

  // Actions
  const apply = () => {
    if (useLocalFile || selectedFileHandle) return;
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
    if (useLocalFile || selectedFileHandle) return;
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
        dirSyncActive={!!selectedFileHandle}
      />
      
      {/* Local Folder Sync UI */}
      <div style={{ padding: "8px 12px", background: "rgba(15, 23, 42, 0.45)", borderRadius: 8, border: "1px solid rgba(144, 202, 249, 0.15)", margin: "8px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#90caf9", display: "flex", alignItems: "center", gap: 4 }}>
            📁 Local Folder Sync
          </span>
          <div style={{ display: "flex", gap: 4 }}>
            <button
              onClick={openDirectory}
              disabled={useLocalFile}
              style={{
                padding: "3px 8px",
                fontSize: 11,
                background: useLocalFile ? "#475569" : "#1976d2",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                cursor: useLocalFile ? "not-allowed" : "pointer"
              }}
            >
              {dirName ? `Folder: ${dirName}` : "Choose Folder"}
            </button>
            {dirName && (
              <button
                onClick={refreshDirectory}
                style={{
                  padding: "3px 8px",
                  fontSize: 11,
                  background: "transparent",
                  color: "#90caf9",
                  border: "1px solid rgba(144, 202, 249, 0.3)",
                  borderRadius: 4,
                  cursor: "pointer"
                }}
                title="Rescan folder for new files"
              >
                🔄 Refresh List
              </button>
            )}
          </div>
        </div>

        {filesList.length > 0 ? (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select
              value={selectedFileName}
              onChange={(e) => handleFileSelect(e.target.value)}
              style={{
                flex: 1,
                padding: "4px 8px",
                fontSize: 12,
                background: "#0f172a",
                color: "#e3f2fd",
                border: "1px solid rgba(144, 202, 249, 0.3)",
                borderRadius: 6,
                outline: "none"
              }}
            >
              <option value="">-- Switch File ({filesList.length} found) --</option>
              {filesList.map((f) => (
                <option key={f.name} value={f.name}>
                  {f.name}
                </option>
              ))}
            </select>
            <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#cbd5e1", whiteSpace: "nowrap", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={autoPoll}
                onChange={(e) => setAutoPoll(e.target.checked)}
              />
              <span>Live Sync</span>
            </label>
          </div>
        ) : (
          <div style={{ fontSize: 11, color: "#64748b" }}>
            {useLocalFile 
              ? "Disabled while Sync with public/sample.yaml is active." 
              : "Select a folder on your computer to detect YAML/JSON files and edit them live."}
          </div>
        )}
      </div>

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
