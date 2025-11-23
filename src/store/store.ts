import create from "zustand";
import { Model, ComponentItem, ElementItem, LinkItem } from "../types";
import yaml from "js-yaml";

const STORAGE_KEY = "achyml:model:v1";

type State = {
  model: Model;
  selectedId?: string | null;
  setModel: (m: Model) => void;
  setModelFromYaml: (yamlStr: string) => { ok: boolean; error?: string };
  toYaml: () => string;
  loadFromStorage: () => void;

  // new actions
  select: (id?: string | null) => void;
  addComponent: (c?: Partial<ComponentItem>) => ComponentItem;
  updateComponent: (id: string, patch: Partial<ComponentItem>) => void;
  removeComponent: (id: string) => void;
  updateElement: (id: string, patch: Partial<ElementItem>) => void;
  styleConfig?: any;
  setStyleConfig: (style: any) => void;
  links?: LinkItem[];
};

const defaultModel: Model = {
  version: 1,
  components: [],
  style: {}
};

export const useStore = create<State>((set, get) => ({
  model: defaultModel,
  selectedId: null,
  styleConfig: {},
  links: [],
  setModel: (m) => {
    set({ model: m });
    set({ links: m.links ?? [] });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(m));
    } catch {}
  },
  setModelFromYaml: (yamlStr) => {
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

      const style = parsed.style ?? {};
      const m: Model = {
        version: parsed.version ?? 1,
        components,
        style,
        links
      };
      get().setModel(m);
      set({ links });
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e.message || String(e) };
    }
  },
  toYaml: () => {
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
          // ensure dependencies array exists only if present later
          if (!el.dependencies) {
            el.dependencies = [];
          } else {
            // clone existing dependencies to avoid duplicates
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
          // keep as top-level link (e.g., component -> component or unknown)
          topLinks.push(l);
        }
      }

      const outObj: any = {
        version: model.version ?? 1,
        components: componentsOut,
        style: model.style ?? {}
      };

      return yaml.dump(outObj);
    } catch {
      return "";
    }
  },
  loadFromStorage: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        set({ model: parsed });
      }
    } catch {}
  },

  // new implementations
  select: (id) => {
    set({ selectedId: id ?? null });
  },

  addComponent: (c) => {
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
    get().setModel(nextModel);
    get().select(id);
    return newComp;
  },

  updateComponent: (id, patch) => {
    const comps = (get().model.components || []).map((cp) => (cp.id === id ? { ...cp, ...patch } : cp));
    const nextModel = { ...(get().model), components: comps };
    get().setModel(nextModel);
  },

  removeComponent: (id) => {
    const comps = (get().model.components || []).filter((cp) => cp.id !== id);
    // also remove links referencing removed component/elements
    const links = (get().model.links || []).filter((l) => l.from !== id && l.to !== id);
    const nextModel = { ...(get().model), components: comps, links };
    get().setModel(nextModel);
    // clear selection if deleted
    if (get().selectedId === id) get().select(null);
  },

  setStyleConfig: (style) => {
    set({ styleConfig: style });
    // Optionally, update model.style for graph rendering
    set((state) => ({
      model: {
        ...state.model,
        style: style
      }
    }));
  },

  updateElement: (id, patch) => {
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
    // This will update YAML, save to localStorage, and trigger UI updates
    get().setModel(nextModel);
  }
}));
