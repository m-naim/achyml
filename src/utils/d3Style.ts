export function getStyle(model: any, type: string, subType?: string, method?: string) {
  const style = model.style ?? {};
  if (!style[type]) return {};
  if (type === "element" && subType === "route" && method && style[type][method]) {
    return { ...style[type].default, ...style[type][subType], ...style[type][method] };
  }
  if (subType && style[type][subType]) return { ...style[type].default, ...style[type][subType] };
  return style[type].default ?? {};
}
