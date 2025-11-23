import React, { useRef, useState } from "react";
import { useStore } from "../../store/store";

export default function SwaggerImportModal({ onClose }: { onClose: () => void }) {
  const [routes, setRoutes] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedCompId, setSelectedCompId] = useState<string>("");
  const [swaggerUrl, setSwaggerUrl] = useState("https://petstore.swagger.io");
  const addComponent = useStore((s) => s.addComponent);
  const updateComponent = useStore((s) => s.updateComponent);
  const components = useStore((s) => s.model.components);

  const workerRef = useRef<Worker | null>(null);

  const handleFile = (files: FileList) => {
  setLoading(true);
  setError(null);
  const file = files[0];
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const swagger = JSON.parse(reader.result as string);
      const extractedRoutes = [];
      if (swagger.paths) {
        for (const path in swagger.paths) {
          for (const method in swagger.paths[path]) {
            const op = swagger.paths[path][method];
            extractedRoutes.push({
              path,
              method: method.toUpperCase(),
              summary: op.summary || "",
              operationId: op.operationId || "",
            });
          }
        }
      }
      setRoutes(extractedRoutes);
      setLoading(false);
    } catch (err: any) {
      setError("Invalid Swagger JSON: " + err.message);
      setLoading(false);
    }
  };
  reader.readAsText(file);
};

  const handleUrlImport = () => {
    setLoading(true);
    setError(null);
    if (!workerRef.current) {
      workerRef.current = new Worker(new URL("../../workers/swaggerWorker.js", import.meta.url));
    }
    workerRef.current.onmessage = (e) => {
      setLoading(false);
      if (e.data.ok) setRoutes(e.data.routes);
      else setError(e.data.error);
    };
    workerRef.current.postMessage(swaggerUrl);
  };

  const handleImport = () => {
    if (!selectedCompId || routes.length === 0) return;
    const comp = components.find(c => c.id === selectedCompId);
    if (!comp) return;
    // Add each route as an element to the selected component
    const newElements = routes.map((r, idx) => ({
      id: `route-${r.method}-${r.path.replace(/[\/{}]/g, "-")}-${idx}`,
      type: "route",
      method: r.method,
      path: r.path,
      name: r.summary || r.operationId || r.path,
      dependencies: []
    }));
    updateComponent(comp.id, {
      elements: [...(comp.elements || []), ...newElements]
    });
    onClose();
  };

  return (
    <div className="swagger-modal-overlay">
      <div className="swagger-modal">
        <h3>Import Swagger/OpenAPI</h3>
        <button className="swagger-modal-close" onClick={onClose}>×</button>
        <input
          type="file"
          accept=".json,.yaml,.yml"
          onChange={e => {
            if (e.target.files && e.target.files[0]) handleFile(e.target.files);
          }}
        />
        <div style={{ margin: "12px 0" }}>
          <input
            type="text"
            placeholder="Or paste Swagger URL (ending with /swagger/index.html)..."
            value={swaggerUrl}
            onChange={e => setSwaggerUrl(e.target.value)}
            style={{ width: "100%", marginBottom: 6 }}
          />
          <button
            onClick={handleUrlImport}
            disabled={!swaggerUrl || loading}
            style={{ width: "100%" }}
          >
            Import from URL
          </button>
        </div>
        {loading && <div>Parsing Swagger...</div>}
        {error && <div style={{ color: "crimson" }}>{error}</div>}
        {routes.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div>
              <label>
                Target Component:
                <select
                  value={selectedCompId}
                  onChange={e => setSelectedCompId(e.target.value)}
                  style={{ marginLeft: 8 }}
                >
                  <option value="">Select...</option>
                  {components.map(c => (
                    <option key={c.id} value={c.id}>{c.name ?? c.id}</option>
                  ))}
                </select>
              </label>
            </div>
            <div style={{ maxHeight: 180, overflowY: "auto", marginTop: 8 }}>
              <strong>Routes to import:</strong>
              <ul>
                {routes.map((r, idx) => (
                  <li key={idx}>
                    <span style={{ fontWeight: 600 }}>{r.method}</span> <span>{r.path}</span>
                    {r.summary && <span style={{ color: "#666" }}> — {r.summary}</span>}
                  </li>
                ))}
              </ul>
            </div>
            <button
              style={{ marginTop: 12 }}
              onClick={handleImport}
              disabled={!selectedCompId}
            >
              Import routes to component
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
