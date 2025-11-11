import React, { useEffect, useState } from "react";
import { useStore } from "./store";
import D3Canvas from "./components/D3Canvas";
import YamlEditor from "./components/YamlEditor";
import Palette from "./components/Palette";
import Properties from "./components/Properties";
import sampleYaml from "../public/sample.yaml?raw";
import { SvgChevron } from "./components/SvgChevron";
import ChainFilter from "./components/ChainFilter";

export default function App() {
  const loadFromStorage = useStore((s) => s.loadFromStorage);
  const setModelFromYaml = useStore((s) => s.setModelFromYaml);
  const [error, setError] = useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(true);
  const [showPaletteAdd, setShowPaletteAdd] = useState(false);
  const [chainFilter, setChainFilter] = useState<{
    active: boolean;
    elementIds: string[];
    linkIds: string[];
  } | null>(null);
  const selectedId = useStore((s) => s.selectedId);
  const model = useStore((s) => s.model);

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

  return (
    <div className="app-grid">
      <aside className="editor-area">
        <YamlEditor />
        {error && <div className="error">{error}</div>}
      </aside>
      <main className="canvas-area">
        {/* Palette toggle button always rendered, positioned absolutely */}
        <button
          className="palette-toggle-button"
          onClick={() => setPaletteOpen((v) => !v)}
          title={paletteOpen ? "Masquer la palette" : "Afficher la palette"}
        >
          {paletteOpen ? (
            <SvgChevron direction="left" />
          ) : (
            <SvgChevron direction="right" />
          )}
        </button>
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
      <aside
        className="palette"
        style={{
          display: paletteOpen && !isElementSelected ? "flex" : "none",
          flexDirection: "column",
          position: "relative",
        }}
      >
        {/* Show only Palette add form if showPaletteAdd is true */}
        {showPaletteAdd ? (
          <Palette onlyAdd={true} onAdd={() => setShowPaletteAdd(false)} />
        ) : (
          <>
            <ChainFilter onFilter={handleChainFilter} />
            <Properties />
          </>
        )}
      </aside>
      {/* When element is selected, show only Properties panel (hide palette) */}
      {isElementSelected && (
        <aside
          className="palette"
          style={{
            display: "flex",
            flexDirection: "column",
            position: "relative",
          }}
        >
          <ChainFilter onFilter={handleChainFilter} />
          <Properties />
        </aside>
      )}
    </div>
  );
}
