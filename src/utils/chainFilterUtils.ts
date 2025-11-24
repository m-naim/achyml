export type ChainFilter = {
  active: boolean;
  elementIds: string[];
  linkIds: string[];
};

export function applyChainFilter(model: any, chainFilter: ChainFilter) {
  if (!chainFilter?.active || chainFilter.elementIds.length === 0) return model;
  return {
    ...model,
    components: (model.components || [])
      .map((comp: any) => ({
        ...comp,
        elements: (comp.elements || []).filter((el: any) =>
          chainFilter.elementIds.includes(el.id)
        ),
      }))
      .filter((comp: any) => comp.elements && comp.elements.length > 0),
    links: (model.links || []).filter((l: any) =>
      chainFilter.linkIds.includes(l.id)
    ),
  };
}

/**
 * Given a model and a selected component id, returns a ChainFilter
 * covering all elements of that component and all their linked chains.
 */
export function calculateChainForComponent(model: any, compId: string): ChainFilter {
  const elementIds: string[] = [];
  const linkIds: string[] = [];
  const visited: Set<string> = new Set();

  // Collect all element ids of the selected component
  const comp = (model.components || []).find((c: any) => c.id === compId);
  if (!comp || !Array.isArray(comp.elements)) return { active: false, elementIds: [], linkIds: [] };

  // Helper to recursively collect chains
  function collectChain(elId: string) {
    if (visited.has(elId)) return;
    visited.add(elId);
    elementIds.push(elId);
    for (const link of model.links || []) {
      if (link.from === elId) {
        linkIds.push(link.id);
        collectChain(link.to);
      }
    }
  }

  for (const el of comp.elements) {
    collectChain(el.id);
  }

  return {
    active: true,
    elementIds,
    linkIds,
  };
}
