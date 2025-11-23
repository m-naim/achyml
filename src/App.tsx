import React, { useEffect, useState, useRef } from "react";
import { useStore } from "./store/store";
import D3Canvas from "./components/canvas_area/D3Canvas";
import YamlEditor from "./components/editor/YamlEditor";
import Palette from "./components/palette/Palette";
import Properties from "./components/palette/Properties";
import sampleYaml from "../public/sample.yaml?raw";
import { SvgChevron } from "./components/canvas_area/SvgChevron";
import ChainFilter from "./components/canvas_area/ChainFilter";
import SwaggerImportModal from "./components/modals/SwaggerImportModal";

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
  const dragState = useRef<{ type: "editor" | "palette" | null, startX: number, startW: number }>({ type: null, startX: 0, startW: 0 });

  // Determine if selectedId is an element (not a component)
  const isElementSelected = selectedId
    ? !model.components.some((c) => c.id === selectedId) &&
      model.components.some((c) =>
        (c.elements || []).some((e) => e.id === selectedId)
      )
    : false;

  useEffect(() => {
    loadFromStorage();
    // if empty load sample
    if (!localStorage.getItem("achyml:model:v1")) {
      const res = setModelFromYaml(sampleYaml);
      if (!res.ok) setError(res.error ?? "Erreur chargement exemple");
    }
  }, []);

  // Handler to activate chain filter from ChainFilter component
  const handleChainFilter = (filter: {
    active: boolean;
    elementIds: string[];
    linkIds: string[];
  }) => {
    setChainFilter(filter);
  };

  // Filter model for D3Canvas if chainFilter is active
  let filteredModel = model;
  if (chainFilter?.active && chainFilter.elementIds.length > 0) {
    filteredModel = {
      ...model,
      components: (model.components || [])
        .map((comp) => ({
          ...comp,
          elements: (comp.elements || []).filter((el) =>
            chainFilter.elementIds.includes(el.id)
          ),
        }))
        .filter((comp) => comp.elements && comp.elements.length > 0),
      links: (model.links || []).filter((l) =>
        chainFilter.linkIds.includes(l.id)
      ),
    };
  }

  // Drag handlers
  const onDragStart = (type: "editor" | "palette", e: React.MouseEvent) => {
    dragState.current = { type, startX: e.clientX, startW: type === "editor" ? editorWidth : paletteWidth };
    document.body.style.cursor = "col-resize";
    window.addEventListener("mousemove", onDragMove);
    window.addEventListener("mouseup", onDragEnd);
  };
  const onDragMove = (e: MouseEvent) => {
    if (dragState.current.type === "editor") {
      let w = Math.max(260, dragState.current.startW + (e.clientX - dragState.current.startX));
      setEditorWidth(w);
    }
    if (dragState.current.type === "palette") {
      let w = Math.max(180, dragState.current.startW - (e.clientX - dragState.current.startX));
      setPaletteWidth(w);
    }
  };
  const onDragEnd = () => {
    dragState.current.type = null;
    document.body.style.cursor = "";
    window.removeEventListener("mousemove", onDragMove);
    window.removeEventListener("mouseup", onDragEnd);
  };

  return (
    <div className="app-grid">
      {/* Editor sidebar */}
      <aside
        className="editor-area"
        ref={editorRef}
        style={{
          minWidth: editorOpen ? editorWidth : 0,
          width: editorOpen ? editorWidth : 0,
          maxWidth: editorOpen ? editorWidth : 0,
          display: editorOpen ? "flex" : "none"
        }}
      >
        <YamlEditor />
        {error && <div className="error">{error}</div>}
        <div
          className="sidebar-resize-handle"
          style={{ right: 0, top: 0, height: "100%", position: "absolute", width: 6, cursor: "col-resize", zIndex: 100 }}
          onMouseDown={e => onDragStart("editor", e)}
        />
        <button
          className="sidebar-hide-btn"
          style={{ position: "absolute", top: 12, left: editorWidth - 28, zIndex: 101 }}
          onClick={() => setEditorOpen(false)}
          title="Hide editor"
        >
          &lt;
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
            <SvgChevron direction="left" />
        </button>
      )}
      <main className="canvas-area">
         <ChainFilter onFilter={handleChainFilter} />
        {/* Palette toggle button always rendered, positioned absolutely */}

        {/* Add component button in graph */}
        {!isElementSelected && (
          <button
            className="add-component-btn"
            onClick={() => setShowPaletteAdd(true)}
          >
            + Add Component
          </button>
        )}
        <div className="compare-grid">
          <div className="canvas-compare right">
            <D3Canvas modelOverride={filteredModel} />
          </div>
        </div>
      </main>
      {/* Palette sidebar */}
      <aside
        className="palette"
        ref={paletteRef}
        style={{
          display: paletteOpen && !isElementSelected ? "flex" : "none",
          flexDirection: "column",
          position: "relative",
          minWidth: paletteOpen ? paletteWidth : 0,
          width: paletteOpen ? paletteWidth : 0,
          maxWidth: paletteOpen ? paletteWidth : 0
        }}
      >
        {/* Add Swagger Import button at the top of palette */}
        <button
          className="swagger-import-btn"
          onClick={() => setSwaggerModalOpen(true)}
        >
          Import Swagger/OpenAPI
        </button>
        {/* Show only Palette add form if showPaletteAdd is true */}
        {showPaletteAdd ? (
          <Palette onlyAdd={true} onAdd={() => setShowPaletteAdd(false)} />
        ) : (
          <>
            <Properties />
          </>
        )}
        {/* Modal for Swagger Import */}
        {swaggerModalOpen && (
          <SwaggerImportModal
            onClose={() => setSwaggerModalOpen(false)}
          />
        )}
        <div
          className="sidebar-resize-handle"
          style={{ left: 0, top: 0, height: "100%", position: "absolute", width: 6, cursor: "col-resize", zIndex: 100 }}
          onMouseDown={e => onDragStart("palette", e)}
        />
        <button
          className="sidebar-hide-btn"
          style={{ position: "absolute", top: 12, right: paletteWidth - 28, zIndex: 101 }}
          onClick={() => setPaletteOpen(false)}
          title="Hide palette"
        >
          &gt;
        </button>
      </aside>
      {/* Show palette show button when hidden */}
      {!paletteOpen && (
        <button
          className="sidebar-show-btn"
          style={{ position: "absolute", right: 0, top: 12, zIndex: 102 }}
          onClick={() => setPaletteOpen(true)}
          title="Show palette"
        >
          &lt;
        </button>
      )}
      {/* When element is selected, show only Properties panel (hide palette) */}
      {isElementSelected && (
        <aside
          className="palette"
          ref={paletteRef}
          style={{
            display: "flex",
            flexDirection: "column",
            position: "relative",
            minWidth: paletteOpen ? paletteWidth : 0,
            width: paletteOpen ? paletteWidth : 0,
            maxWidth: paletteOpen ? paletteWidth : 0
          }}
        >
          <Properties />
          <div
            className="sidebar-resize-handle"
            style={{ left: 0, top: 0, height: "100%", position: "absolute", width: 6, cursor: "col-resize", zIndex: 100 }}
            onMouseDown={e => onDragStart("palette", e)}
          />
          <button
            className="sidebar-hide-btn"
            style={{ position: "absolute", top: 12, right: paletteWidth - 28, zIndex: 101 }}
            onClick={() => setPaletteOpen(false)}
            title="Hide palette"
          >
            &gt;
          </button>
        </aside>
      )}
    </div>
  );
}
