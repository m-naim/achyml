import yaml from "js-yaml";
import { STORAGE_KEY, defaultModel } from "./storeTypes";
import { ComponentItem, ElementItem, LinkItem, Model } from "../types";
// Add types for set and get parameters
import { State } from "./storeTypes";

// Set model
export function setModel(
  set: (partial: Partial<State> | ((state: State) => Partial<State>), replace?: boolean) => void,
  get: () => State,
  m: Model
) {
  set({ model: m });
  set({ links: m.links ?? [] });
  set({ componentTypes: m.componentTypes ?? [] });
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(m));
  } catch {}
}

// Load model from YAML
export function setModelFromYaml(
  set: (partial: Partial<State> | ((state: State) => Partial<State>), replace?: boolean) => void,
  get: () => State,
  yamlStr: string
) {
  try {
    const parsed = yaml.load(yamlStr) as any;
    if (!parsed || !Array.isArray(parsed.components)) {
      return { ok: false, error: "YAML must contain 'components' array" };
    }
    const components: ComponentItem[] = parsed.components as ComponentItem[];

    // build maps: element ids set, and component -> first element id (for auto-mapping)
    const elementIdSet = new Set<string>();
    const compToFirstEl = new Map<string, string>();
    for (const comp of components) {
      if (Array.isArray(comp.elements) && comp.elements.length > 0) {
        for (const el of comp.elements) {
          if (el && el.id) elementIdSet.add(el.id);
        }
        const first = comp.elements[0];
        if (first && first.id) compToFirstEl.set(comp.id, first.id);
      }
    }

    // Rebuild dependencies from links if present, else keep dependencies from YAML
    let links: LinkItem[] = [];
    if (Array.isArray(parsed.links)) {
      links = (parsed.links as LinkItem[]).map((l: any, idx: number) => ({
        id: l.id ?? `link-top-${idx}`,
        from: l.from,
        to: l.to,
        label: l.label
      }));
    } else {
      // If no links, build from dependencies in elements
      for (const comp of components) {
        if (!Array.isArray(comp.elements)) continue;
        for (const el of comp.elements) {
          if (Array.isArray(el.dependencies)) {
            for (const dep of el.dependencies) {
              links.push({
                id: `dep-${el.id}-to-${dep.to}`,
                from: el.id,
                to: dep.to,
                label: dep.label
              });
            }
          }
        }
      }
    }

    // Normalize links: ensure 'from' and 'to' are element ids.
    for (const l of links) {
      if (!elementIdSet.has(l.from)) {
        if (compToFirstEl.has(l.from)) {
          l.from = compToFirstEl.get(l.from)!;
        } else {
          return { ok: false, error: `Link ${l.id} references unknown source '${l.from}'. Links must reference element ids (or a component with at least one element).` };
        }
      }
      if (!elementIdSet.has(l.to)) {
        if (compToFirstEl.has(l.to)) {
          l.to = compToFirstEl.get(l.to)!;
        } else {
          return { ok: false, error: `Link ${l.id} references unknown target '${l.to}'. Links must reference element ids (or a component with at least one element).` };
        }
      }
    }

    // Rebuild dependencies for each element from links
    for (const comp of components) {
      if (!Array.isArray(comp.elements)) continue;
      for (const el of comp.elements) {
        el.dependencies = [];
      }
    }
    for (const l of links) {
      for (const comp of components) {
        if (!Array.isArray(comp.elements)) continue;
        for (const el of comp.elements) {
          if (el.id === l.from) {
            el.dependencies = el.dependencies || [];
            el.dependencies.push({ to: l.to, label: l.label });
          }
        }
      }
    }

    // Extract unique component types from YAML
    let componentTypes: string[] = [];
    if (Array.isArray(parsed.componentTypes)) {
      componentTypes = parsed.componentTypes;
    } else {
      componentTypes = Array.from(new Set((components || []).map((c: any) => c.type))).filter(Boolean);
    }

    const style = parsed.style ?? {};
    const m: Model = {
      version: parsed.version ?? 1,
      components,
      style,
      links,
      componentTypes
    };
    setModel(set, get, m);
    set({ links, componentTypes });
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message || String(e) };
  }
}

// Convert model to YAML
export function toYaml(
  set: (partial: Partial<State> | ((state: State) => Partial<State>), replace?: boolean) => void,
  get: () => State
) {
  try {
    const model = get().model;
    // deep clone components to avoid mutating store
    const componentsOut: ComponentItem[] = (model.components || []).map((c) => ({
      ...c,
      elements: (c.elements || []).map((el) => ({ ...el }))
    }));

    // build element id -> element reference map
    const elMap = new Map<string, { compIdx: number; elIdx: number }>();
    componentsOut.forEach((comp, ci) => {
      (comp.elements || []).forEach((el, ei) => {
        elMap.set(el.id, { compIdx: ci, elIdx: ei });
        if (!el.dependencies) {
          el.dependencies = [];
        } else {
          el.dependencies = [...el.dependencies];
        }
      });
    });

    // clear dependencies (we will re-fill from links)
    componentsOut.forEach((comp) =>
      (comp.elements || []).forEach((el) => {
        el.dependencies = [];
      })
    );

    // Distribute links into element.dependencies when source is an element id
    const topLinks: LinkItem[] = [];
    for (const l of model.links || []) {
      if (elMap.has(l.from)) {
        const pos = elMap.get(l.from)!;
        const el = componentsOut[pos.compIdx].elements![pos.elIdx];
        el.dependencies = el.dependencies || [];
        el.dependencies.push({ to: l.to, label: l.label });
      } else {
        topLinks.push(l);
      }
    }

    const outObj: any = {
      version: model.version ?? 1,
      components: componentsOut,
      style: model.style ?? {},
      componentTypes: model.componentTypes ?? []
    };

    return yaml.dump(outObj);
  } catch {
    return "";
  }
}

// Load model from localStorage
export function loadFromStorage(
  set: (partial: Partial<State> | ((state: State) => Partial<State>), replace?: boolean) => void,
  get: () => State
) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      set({ model: parsed });
    }
  } catch {}
}

// Select an id
export function select(
  set: (partial: Partial<State> | ((state: State) => Partial<State>), replace?: boolean) => void,
  get: () => State,
  id?: string | null
) {
  set({ selectedId: id ?? null });
}

// Add a component
export function addComponent(
  set: (partial: Partial<State> | ((state: State) => Partial<State>), replace?: boolean) => void,
  get: () => State,
  c?: Partial<ComponentItem>
) {
  const id = c?.id ?? `comp-${Date.now().toString(36)}`;
  const newComp: ComponentItem = {
    id,
    type: c?.type ?? "microservice",
    name: c?.name ?? id,
    level: c?.level ?? 1,
    column: c?.column ?? 1,
    elements: c?.elements ?? [],
    ...c
  };
  const nextModel = { ...(get().model), components: [...(get().model.components || []), newComp] };
  setModel(set, get, nextModel);
  select(set, get, id);
  return newComp;
}

// Update a component
export function updateComponent(
  set: (partial: Partial<State> | ((state: State) => Partial<State>), replace?: boolean) => void,
  get: () => State,
  id: string,
  patch: Partial<ComponentItem>
) {
  const comps = (get().model.components || []).map((cp) => (cp.id === id ? { ...cp, ...patch } : cp));
  const nextModel = { ...(get().model), components: comps };
  setModel(set, get, nextModel);
}

// Remove a component
export function removeComponent(
  set: (partial: Partial<State> | ((state: State) => Partial<State>), replace?: boolean) => void,
  get: () => State,
  id: string
) {
  const comps = (get().model.components || []).filter((cp) => cp.id !== id);
  // also remove links referencing removed component/elements
  const links = (get().model.links || []).filter((l) => l.from !== id && l.to !== id);
  const nextModel = { ...(get().model), components: comps, links };
  setModel(set, get, nextModel);
  if (get().selectedId === id) select(set, get, null);
}

// Set style config
export function setStyleConfig(
  set: (partial: Partial<State> | ((state: State) => Partial<State>), replace?: boolean) => void,
  get: () => State,
  style: any
) {
  set({ styleConfig: style });
  set((state) => ({
    model: {
      ...state.model,
      style: style
    }
  }));
}

// Update an element
export function updateElement(
  set: (partial: Partial<State> | ((state: State) => Partial<State>), replace?: boolean) => void,
  get: () => State,
  id: string,
  patch: Partial<ElementItem>
) {
  const model = get().model;
  let newLinks = model.links ? [...model.links] : [];
  let prevDependencies: any[] = [];
  let newDependencies: any[] = [];

  // Find the element and its previous dependencies
  for (const comp of model.components) {
    if (!comp.elements) continue;
    for (const el of comp.elements) {
      if (el.id === id) {
        prevDependencies = el.dependencies ?? [];
      }
    }
  }

  // If dependencies are being updated, handle links
  if (patch.dependencies) {
    newDependencies = patch.dependencies;
    // Add links for new dependencies not already present
    newDependencies.forEach(dep => {
      const exists = newLinks.some(l => l.from === id && l.to === dep.to);
      if (!exists) {
        newLinks.push({
          id: `dep-${id}-to-${dep.to}`,
          from: id,
          to: dep.to,
          label: dep.label
        });
      }
    });
    // Optionally, remove links for deleted dependencies
    prevDependencies.forEach(dep => {
      if (!newDependencies.some(nd => nd.to === dep.to)) {
        newLinks = newLinks.filter(l => !(l.from === id && l.to === dep.to));
      }
    });
  }

  // Update the element in components
  const comps = (model.components || []).map((comp) => {
    if (!comp.elements) return comp;
    const elements = comp.elements.map((el) =>
      el.id === id ? { ...el, ...patch } : el
    );
    return { ...comp, elements };
  });
  const nextModel = { ...model, components: comps, links: newLinks };
  setModel(set, get, nextModel);
}
