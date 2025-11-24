import create from "zustand";
import { State, defaultModel } from "./storeTypes";
import * as actions from "./storeActions";

export const useStore = create<State>((set, get) => ({
  model: defaultModel,
  selectedId: null,
  styleConfig: {},
  links: [],
  componentTypes: [],
  setModel: (m) => actions.setModel(set, get, m),
  setModelFromYaml: (yamlStr) => actions.setModelFromYaml(set, get, yamlStr),
  toYaml: () => actions.toYaml(set, get),
  loadFromStorage: () => actions.loadFromStorage(set, get),
  select: (id) => actions.select(set, get, id),
  addComponent: (c) => actions.addComponent(set, get, c),
  updateComponent: (id, patch) => actions.updateComponent(set, get, id, patch),
  removeComponent: (id) => actions.removeComponent(set, get, id),
  setStyleConfig: (style) => actions.setStyleConfig(set, get, style),
  updateElement: (id, patch) => actions.updateElement(set, get, id, patch),
}));
