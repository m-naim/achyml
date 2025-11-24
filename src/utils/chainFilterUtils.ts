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
 * covering all elements of that component and their upstream/downstream chains.
 * Upstream: only include elements that are dependencies of the selected component's elements.
 * Downstream: only include elements that depend on the selected component's elements.
 */
export function calculateChainForComponent(model: any, compId: string): ChainFilter {
  const elementIds: string[] = [];
  const linkIds: string[] = [];
  const visitedDown: Set<string> = new Set();
  const visitedUp: Set<string> = new Set();

  // Get all element ids of the selected component
  const comp = (model.components || []).find((c: any) => c.id === compId);
  if (!comp || !Array.isArray(comp.elements)) return { active: false, elementIds: [], linkIds: [] };
  const startElementIds = comp.elements.map((el: any) => el.id);

  // Downstream: follow links from the selected component's elements
  function collectDownstream(elId: string) {
    if (visitedDown.has(elId)) return;
    visitedDown.add(elId);
    elementIds.push(elId);
    for (const link of model.links || []) {
      if (link.from === elId) {
        linkIds.push(link.id);
        collectDownstream(link.to);
      }
    }
  }

  // Upstream: follow links to the selected component's elements
  function collectUpstream(elId: string) {
    if (visitedUp.has(elId)) return;
    visitedUp.add(elId);
    elementIds.push(elId);
    for (const link of model.links || []) {
      if (link.to === elId) {
        linkIds.push(link.id);
        collectUpstream(link.from);
      }
    }
  }

  // Only collect for elements of the selected component
  for (const elId of startElementIds) {
    collectDownstream(elId);
    collectUpstream(elId);
  }

  // Remove duplicates in elementIds
  const uniqueElementIds = Array.from(new Set(elementIds));

  return {
    active: true,
    elementIds: uniqueElementIds,
    linkIds,
  };
}
