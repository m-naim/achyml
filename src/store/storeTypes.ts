import { Model, ComponentItem, ElementItem, LinkItem } from "../types";

export type State = {
  model: Model;
  selectedId?: string | null;
  setModel: (m: Model) => void;
  setModelFromYaml: (yamlStr: string) => { ok: boolean; error?: string };
  toYaml: () => string;
  loadFromStorage: () => void;
  select: (id?: string | null) => void;
  addComponent: (c?: Partial<ComponentItem>) => ComponentItem;
  updateComponent: (id: string, patch: Partial<ComponentItem>) => void;
  removeComponent: (id: string) => void;
  updateElement: (id: string, patch: Partial<ElementItem>) => void;
  styleConfig?: any;
  setStyleConfig: (style: any) => void;
  links?: LinkItem[];
  componentTypes: string[];
};

export const STORAGE_KEY = "achyml:model:v1";

export const defaultModel: Model = {
  version: 1,
  components: [],
  style: {},
  links: [],
  componentTypes: []
};
