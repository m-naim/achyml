import React, { useEffect, useState, useRef } from "react";
import { useStore } from "../../store/store";
import { setupYamlMonacoSchema } from "../../utils/yamlMonaco";
import YamlEditorToolbar from "./YamlEditorToolbar";
import YamlMonacoEditor from "./YamlMonacoEditor";
import jsYaml from "js-yaml";

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

function normalizePath(p: string): string {
  return p.replace(/\\/g, '/').replace(/^\.\//, '');
}

function resolveRelativePath(currentFilePath: string, referencedPath: string): string {
  const normalizedCurrent = normalizePath(currentFilePath);
  const normalizedRef = referencedPath.replace(/\\/g, '/');
  
  if (normalizedRef.startsWith('/')) {
    return normalizedRef.substring(1);
  }
  
  const lastSlash = normalizedCurrent.lastIndexOf('/');
  const currentDir = lastSlash !== -1 ? normalizedCurrent.substring(0, lastSlash) : "";
  
  const dirSegments = currentDir ? currentDir.split('/') : [];
  const refSegments = normalizedRef.split('/');
  
  const resultSegments = [...dirSegments];
  for (const segment of refSegments) {
    if (segment === "." || segment === "") {
      continue;
    }
    if (segment === "..") {
      resultSegments.pop();
    } else {
      resultSegments.push(segment);
    }
  }
  return resultSegments.join('/');
}

async function bundleFilesInBrowser(mainFileName: string, filesList: Array<{ name: string; handle: any }>): Promise<{ ok: boolean; model?: any; error?: string }> {
  try {
    const mainItem = filesList.find(f => normalizePath(f.name) === normalizePath(mainFileName));
    if (!mainItem) {
      return { ok: false, error: `Main file '${mainFileName}' not found.` };
    }

    const allComponents: any[] = [];
    const allLinks: any[] = [];
    const visited = new Set<string>();

    function extractComponents(parsedDoc: any): any[] {
      if (!parsedDoc) return [];
      if (Array.isArray(parsedDoc)) {
        return parsedDoc.flatMap(extractComponents);
      }
      const comps: any[] = [];
      if (parsedDoc.components && Array.isArray(parsedDoc.components)) {
        comps.push(...parsedDoc.components.filter((c: any) => c && typeof c === "object"));
      }
      if (parsedDoc.id && parsedDoc.type) {
        comps.push(parsedDoc);
      }
      return comps;
    }

    function extractLinks(parsedDoc: any): any[] {
      if (!parsedDoc) return [];
      if (Array.isArray(parsedDoc)) {
        return parsedDoc.flatMap(extractLinks);
      }
      const links: any[] = [];
      if (parsedDoc.links && Array.isArray(parsedDoc.links)) {
        links.push(...parsedDoc.links.filter((l: any) => l && typeof l === "object"));
      }
      return links;
    }

    async function resolveFile(filePath: string): Promise<any> {
      const normalized = normalizePath(filePath);
      if (visited.has(normalized)) return null;
      visited.add(normalized);

      const item = filesList.find(f => normalizePath(f.name) === normalized);
      if (!item) {
        throw new Error(`File '${filePath}' not found in the selected folder.`);
      }

      const file = await item.handle.getFile();
      const text = await file.text();
      let doc: any;
      try {
        if (normalized.endsWith(".json")) {
          doc = JSON.parse(text);
        } else {
          doc = jsYaml.load(text);
        }
      } catch (e: any) {
        throw new Error(`Parse error in '${filePath}': ${e.message}`);
      }

      if (!doc) return null;

      // Extract inline components and links
      if (Array.isArray(doc)) {
        for (const element of doc) {
          if (element && typeof element === "object") {
            if (element.id && element.type) {
              allComponents.push(element);
            } else {
              allComponents.push(...extractComponents(element));
              allLinks.push(...extractLinks(element));
            }
          }
        }
      } else {
        if (doc.components && Array.isArray(doc.components)) {
          const inlineComps = doc.components.filter((c: any) => c && typeof c === "object");
          allComponents.push(...inlineComps);
        }
        if (doc.links && Array.isArray(doc.links)) {
          allLinks.push(...doc.links);
        }
        if (doc.id && doc.type) {
          allComponents.push(doc);
        }
      }

      // Collect references
      const references: string[] = [];
      if (!Array.isArray(doc)) {
        if (doc.resources && Array.isArray(doc.resources)) {
          references.push(...doc.resources.filter((r: any) => typeof r === "string"));
        }
        if (doc.imports && Array.isArray(doc.imports)) {
          references.push(...doc.imports.filter((r: any) => typeof r === "string"));
        }
        if (doc.include && Array.isArray(doc.include)) {
          references.push(...doc.include.filter((r: any) => typeof r === "string"));
        }
        if (doc.components && Array.isArray(doc.components)) {
          references.push(...doc.components.filter((c: any) => typeof c === "string"));
        }
      }

      // Resolve references relative to the current file
      for (const ref of references) {
        const resolvedPath = resolveRelativePath(normalized, ref);
        await resolveFile(resolvedPath);
      }

      return doc;
    }

    const mainDoc = await resolveFile(mainFileName);
    if (!mainDoc) {
      return { ok: false, error: `Main file '${mainFileName}' is empty or invalid.` };
    }

    // Fallback: If only the main file was visited (meaning it contains no string references to other files),
    // and there are other files in filesList, we fall back to the old behavior (bundling all files).
    if (visited.size === 1 && filesList.length > 1) {
      for (const item of filesList) {
        if (normalizePath(item.name) === normalizePath(mainFileName)) continue;
        try {
          const file = await item.handle.getFile();
          const text = await file.text();
          let doc: any;
          if (item.name.endsWith(".json")) {
            doc = JSON.parse(text);
          } else {
            doc = jsYaml.load(text);
          }
          if (doc) {
            allComponents.push(...extractComponents(doc));
            allLinks.push(...extractLinks(doc));
          }
        } catch (err: any) {
          console.warn(`Skipped fallback bundling file ${item.name}:`, err);
        }
      }
    }

    const finalDoc = { ...mainDoc };
    finalDoc.components = allComponents;
    finalDoc.links = allLinks;

    return { ok: true, model: finalDoc };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
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

  const handleFileSelect = (fileName: string) => {
    setSelectedFileName(fileName);
    if (!fileName) {
      setSelectedFileHandle(null);
    } else {
      const item = filesList.find(f => f.name === fileName);
      if (item) setSelectedFileHandle(item.handle);
    }
  };

  // Auto-polling and browser-based bundling logic
  useEffect(() => {
    if (filesList.length === 0 || !selectedFileName) return;
    let active = true;
    
    // Store last modified times for all files in the list
    const fileTimestamps = new Map<string, number>();

    // Initial load and bundle
    const initializeAndBundle = async () => {
      try {
        for (const item of filesList) {
          const file = await item.handle.getFile();
          fileTimestamps.set(item.name, file.lastModified);
        }
        
        const res = await bundleFilesInBrowser(selectedFileName, filesList);
        if (active) {
          if (res.ok && res.model) {
            const yamlStr = jsYaml.dump(res.model);
            const importRes = store.setModelFromYaml(yamlStr);
            if (!importRes.ok) {
              setMsg(`Bundle validation error: ${importRes.error}`);
            } else {
              setMsg(`Bundled ${selectedFileName} + ${filesList.length - 1} component files`);
              setTimeout(() => setMsg(null), 2500);
            }
          } else {
            setMsg(`Bundle error: ${res.error}`);
          }
        }
      } catch (err: any) {
        console.error("Failed to initialize timestamps", err);
      }
    };

    initializeAndBundle();

    if (!autoPoll) return; // don't start polling loop if disabled

    // Polling function
    const checkFiles = async () => {
      let changed = false;
      try {
        for (const item of filesList) {
          const file = await item.handle.getFile();
          const prevTime = fileTimestamps.get(item.name) || 0;
          if (file.lastModified !== prevTime) {
            fileTimestamps.set(item.name, file.lastModified);
            changed = true;
          }
        }

        if (changed && active) {
          const res = await bundleFilesInBrowser(selectedFileName, filesList);
          if (res.ok && res.model) {
            const yamlStr = jsYaml.dump(res.model);
            const importRes = store.setModelFromYaml(yamlStr);
            if (!importRes.ok) {
              setMsg(`Auto-sync validation error: ${importRes.error}`);
            } else {
              setMsg(`Auto-rebundled ${selectedFileName} (changes detected)`);
              setTimeout(() => setMsg(null), 1500);
            }
          } else {
            setMsg(`Bundle error: ${res.error}`);
          }
        }
      } catch (err: any) {
        console.error("Failed checking files during polling", err);
      }
    };

    const interval = setInterval(() => {
      if (active) checkFiles();
    }, 1000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [filesList, selectedFileName, autoPoll]);

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
