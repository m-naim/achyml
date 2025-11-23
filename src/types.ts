export type ElementItem = {
  id: string;
  type: string;
  name?: string;
  [k: string]: any;
  // dependencies expressed as preferred by the user:
  // - to: <target-id>
  //   label: <optional-label>
  dependencies?: { to: string; label?: string }[];
};

export type ComponentItem = {
  name: string;
  type: string;
  level?: number;
  column?: number;
  elements?: ElementItem[];
  [k: string]: any;
};

export type LinkItem = {
  id: string;
  from: string;
  to: string;
  label?: string;
};

export type Model = {
  version?: number;
  components: ComponentItem[];
  links?: LinkItem[];
  style?:  { [key: string]: any };
};
