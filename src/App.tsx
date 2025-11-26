import React, { useEffect, useState, useRef } from "react";
import { useStore } from "./store/store";
import D3Canvas, { D3CanvasHandle } from "./components/canvas_area/D3Canvas";
import YamlEditor from "./components/editor/YamlEditor";
import Palette from "./components/palette/Palette";
import Properties from "./components/palette/Properties";
import sampleYaml from "../public/sample.yaml?url&raw";
// import { SvgChevron } from "./components/canvas_area/SvgChevron";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import SwaggerImportModal from "./components/modals/SwaggerImportModal";
import { applyChainFilter } from "./utils/chainFilterUtils";
import { useSidebarDrag } from "./utils/useSidebarDrag";
import ActionBar from "./components/canvas_area/ActionBar";

export default function App() {
  const loadFromStorage = useStore((s) => s.loadFromStorage);
  const setModelFromYaml = useStore((s) => s.setModelFromYaml);
  const [error, setError] = useState<string | null>(null);
  const [showPaletteAdd, setShowPaletteAdd] = useState(false);
  const [chainFilter, setChainFilter] = useState<{
    active: boolean;
    elementIds: string[];
    linkIds: string[];
  } | null>(null);
  const [swaggerModalOpen, setSwaggerModalOpen] = useState(false);
  const selectedId = useStore((s) => s.selectedId);
  const model = useStore((s) => s.model);
  const [editorWidth, setEditorWidth] = useState(460);
  const [paletteWidth, setPaletteWidth] = useState(260);
  const [editorOpen, setEditorOpen] = useState(true);
  const [paletteOpen, setPaletteOpen] = useState(true);
  const editorRef = useRef<HTMLDivElement>(null);
  const paletteRef = useRef<HTMLDivElement>(null);
  const select = useStore((s) => s.select);
  const d3CanvasRef = useRef<D3CanvasHandle>(null);

  const { onDragStart } = useSidebarDrag({
    editorWidth,
    setEditorWidth,
    paletteWidth,
    setPaletteWidth,
  });

  useEffect(() => {
    loadFromStorage();
    if (!localStorage.getItem("achyml:model:v1")) {
      const res = setModelFromYaml(sampleYaml);
      if (!res.ok) setError(res.error ?? "Erreur chargement exemple");
    }
  }, []);

  const handleChainFilter = (filter: {
    active: boolean;
    elementIds: string[];
    linkIds: string[];
  }) => {
    setChainFilter(filter);
  };


  const handleActionAddComponent = () => {
    select(null);
    setShowPaletteAdd(true)
  };




  let filteredModel = model;
  if (chainFilter?.active && chainFilter.elementIds.length > 0) {
    filteredModel = applyChainFilter(model, chainFilter);
  }

  // Zoom to selectedId when it changes
  useEffect(() => {
    if (selectedId && d3CanvasRef.current) {
      d3CanvasRef.current.zoomToElement(selectedId);
    }
  }, [selectedId]);

  return (
    <div className="app-grid">
      <aside
        className="editor-area"
        ref={editorRef}
        style={{
          minWidth: editorOpen ? editorWidth : 0,
          width: editorOpen ? editorWidth : 0,
          maxWidth: editorOpen ? editorWidth : 0,
          display: editorOpen ? "flex" : "none",
        }}
      >
        <YamlEditor />
        {error && <div className="error">{error}</div>}
        <div
          className="sidebar-resize-handle"
          style={{
            right: 0,
            top: 0,
            height: "100%",
            position: "absolute",
            width: 6,
            cursor: "col-resize",
            zIndex: 100,
          }}
          onMouseDown={(e) => onDragStart("editor", e)}
        />
        <button
          className="sidebar-hide-btn"
          style={{
            position: "absolute",
            top: 12,
            left: editorWidth - 28,
            zIndex: 101,
          }}
          onClick={() => setEditorOpen(false)}
          title="Hide editor"
        >
          <ChevronLeft size={20} />
        </button>
      </aside>
      {/* Show editor show button when hidden */}
      {!editorOpen && (
        <button
          className="sidebar-show-btn"
          style={{ position: "absolute", left: 0, top: 12, zIndex: 102 }}
          onClick={() => setEditorOpen(true)}
          title="Show editor"
        >
          <ChevronRight size={20} />
        </button>
      )}
      <main className="canvas-area">

        <ActionBar
          onChainFilter={handleChainFilter}
          onAddComponent={handleActionAddComponent}
          chainFilterActive={!!chainFilter?.active}
          selectedId={selectedId}
          onDeselect={() => select(null)}
        />
        
        <div className="compare-grid">
          <div className="canvas-compare right">
            <D3Canvas ref={d3CanvasRef} modelOverride={filteredModel} />
          </div>
        </div>
      </main>

      <aside
        className="palette"
        ref={paletteRef}
        style={{
          minWidth: paletteOpen ? paletteWidth : 0,
          width: paletteOpen ? paletteWidth : 0,
          maxWidth: paletteOpen ? paletteWidth : 0,
        }}
      >
        <button
          className="swagger-import-btn"
          onClick={() => setSwaggerModalOpen(true)}
        >
          Import Swagger/OpenAPI
        </button>

        {selectedId && <Properties />}
        {!selectedId && showPaletteAdd && (
          <Palette onlyAdd={true} onAdd={() => setShowPaletteAdd(false)} />
        )}
        {/* Modal for Swagger Import */}
        {swaggerModalOpen && (
          <SwaggerImportModal onClose={() => setSwaggerModalOpen(false)} />
        )}

        <div
          className="sidebar-resize-handle"
          style={{
            left: 0,
            top: 0,
            height: "100%",
            position: "absolute",
            width: 6,
            cursor: "col-resize",
            zIndex: 100,
          }}
          onMouseDown={(e) => onDragStart("palette", e)}
        />
        {paletteOpen && (
          <button
            className="sidebar-hide-btn"
            style={{
              position: "absolute",
              top: 12,
              right: paletteWidth - 28,
              zIndex: 101,
            }}
            onClick={() => setPaletteOpen(false)}
            title="Hide palette"
          >
            <ChevronRight size={20} />
          </button>
        )}
      </aside>

      {!paletteOpen && (
        <button
          className="sidebar-show-btn"
          style={{ position: "absolute", right: 0, top: 12, zIndex: 102 }}
          onClick={() => setPaletteOpen(true)}
          title="Show palette"
        >
          <ChevronLeft size={20} />
        </button>
      )}
    </div>
  );
}
