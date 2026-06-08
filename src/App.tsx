import React, { useEffect, useState, useRef } from "react";
import { useStore } from "./store/store";
import D3Canvas, { D3CanvasHandle } from "./components/canvas_area/D3Canvas";
import YamlEditor from "./components/editor/YamlEditor";
import Palette from "./components/palette/Palette";
import Properties from "./components/palette/Properties";
import sampleYaml from "/sample.yaml?url&raw";
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
  const [elementFilter, setElementFilter] = useState("");
  const [parentsOnly, setParentsOnly] = useState(false);
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

  const [useLocalFile, setUseLocalFile] = useState<boolean>(() => {
    return localStorage.getItem("achyml:use_local_file") === "true";
  });

  const handleToggleLocalFile = (val: boolean) => {
    localStorage.setItem("achyml:use_local_file", String(val));
    setUseLocalFile(val);
  };

  useEffect(() => {
    if (useLocalFile) {
      setError(null);
      fetch(`/sample.yaml?t=${Date.now()}`)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP status: ${res.status}`);
          return res.text();
        })
        .then((text) => {
          const res = setModelFromYaml(text);
          if (!res.ok) setError(res.error ?? "Erreur chargement exemple");
        })
        .catch((err) => {
          setError("Erreur chargement fichier local: " + err.message);
        });
    } else {
      loadFromStorage();
      if (!localStorage.getItem("achyml:model:v1")) {
        const res = setModelFromYaml(sampleYaml);
        if (!res.ok) setError(res.error ?? "Erreur chargement exemple");
      }
    }
  }, [useLocalFile]);

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
  
  if (elementFilter) {
    const lowerFilter = elementFilter.toLowerCase();
    const newComponents = (filteredModel.components || [])
      .map((comp: any) => ({
        ...comp,
        elements: (comp.elements || []).filter((el: any) => {
          const t = el.type?.toLowerCase() || "";
          const m = el.method?.toLowerCase() || "";
          const pt = comp.type?.toLowerCase() || "";
          return t.includes(lowerFilter) || m.includes(lowerFilter) || pt.includes(lowerFilter);
        }),
      }))
      .filter((comp: any) => comp.elements && comp.elements.length > 0);
      
    const survivingElementIds = new Set(
      newComponents.flatMap((c: any) => c.elements.map((e: any) => e.id))
    );
    
    const newLinks = (filteredModel.links || []).filter((l: any) => 
      survivingElementIds.has(l.from) && survivingElementIds.has(l.to)
    );

    filteredModel = {
      ...filteredModel,
      components: newComponents,
      links: newLinks,
    };
  }

  if (chainFilter?.active && chainFilter.elementIds.length > 0) {
    filteredModel = applyChainFilter(filteredModel, chainFilter);
  }

  if (parentsOnly) {
    const elToComp = new Map<string, string>();
    (filteredModel.components || []).forEach((c: any) => {
      (c.elements || []).forEach((e: any) => {
        elToComp.set(e.id, c.id);
      });
    });

    const newComponents = (filteredModel.components || []).map((c: any) => ({
      ...c,
      elements: []
    }));

    const compLinksMap = new Map<string, any>();
    (filteredModel.links || []).forEach((l: any) => {
      const compFrom = elToComp.get(l.from) || l.from;
      const compTo = elToComp.get(l.to) || l.to;
      if (compFrom !== compTo) {
        const linkId = `${compFrom}->${compTo}`;
        if (!compLinksMap.has(linkId)) {
          compLinksMap.set(linkId, {
            id: linkId,
            from: compFrom,
            to: compTo,
          });
        }
      }
    });
    
    filteredModel = {
      ...filteredModel,
      components: newComponents,
      links: Array.from(compLinksMap.values()),
    };
  }

  // Zoom to selectedId or reset view when it changes
  useEffect(() => {
    if (d3CanvasRef.current) {
      if (selectedId) {
        d3CanvasRef.current.zoomToElement(selectedId);
      } else {
        d3CanvasRef.current.resetZoom();
      }
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
        <YamlEditor useLocalFile={useLocalFile} onToggleLocalFile={handleToggleLocalFile} />
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
          elementFilter={elementFilter}
          onElementFilterChange={setElementFilter}
          parentsOnly={parentsOnly}
          onParentsOnlyToggle={() => setParentsOnly(!parentsOnly)}
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
