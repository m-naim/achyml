import type { ComponentItem } from "../types";

const COL_WIDTH = 320;
const COLUMN_GAP = 160;
const ROW_HEIGHT = 240;
const ELEMENT_W = 240;
const ELEMENT_H = 40;
const ELEMENT_GAP = 24;
const PARENT_PADDING = 32;

export function computeDynamicComponentPositions(components: ComponentItem[]) {

  // Map: col -> level -> [components]
  const gridMap = new Map<number, Map<number, ComponentItem[]>>();
  for (const c of components || []) {
    const col = Number(c.column ?? 1);
    const lvl = Number(c.level ?? 1);
    if (!gridMap.has(col)) gridMap.set(col, new Map());
    if (!gridMap.get(col)!.has(lvl)) gridMap.get(col)!.set(lvl, []);
    gridMap.get(col)!.get(lvl)!.push(c);
  }
  const sortedCols = Array.from(gridMap.keys()).sort((a, b) => a - b);
  const sortedLevels = Array.from(
    new Set(
      Array.from(gridMap.values())
        .flatMap((lvlMap) => Array.from(lvlMap.keys()))
    )
  ).sort((a, b) => a - b);

  // For each column/level, stack components vertically, spacing by their dynamic height
  const compPositions = new Map<string, { x: number; y: number }>();
  const colSpacing = COL_WIDTH + COLUMN_GAP;
  for (const col of sortedCols) {
    const lvlMap = gridMap.get(col)!;
    let y = 0;
    let lastCompHeight=0;
    let lastY=0;
    for (const lvl of sortedLevels) {
      const comps = lvlMap.get(lvl) || [];
      for (const comp of comps) {
        const elementsCount = comp.elements?.length ?? 0;
        const compHeight = Math.max(
          ROW_HEIGHT  +  PARENT_PADDING * 2,
          elementsCount * ELEMENT_H + elementsCount* ELEMENT_GAP +  PARENT_PADDING * 4
        );
        const x = (col - 1) * colSpacing + 60;
        y = lastY+ lastCompHeight;
        compPositions.set(comp.id, { x, y });
        lastY=y;
        lastCompHeight= compHeight;
        
      }
    }
  }
  return compPositions;
}

export function computeElementPositions(components: ComponentItem[], compPositions: Map<string, { x: number; y: number }>) {
  const elPositions = new Map<string, { x: number; y: number; width: number; height: number }>();
  for (const comp of components || []) {
    const parentPos = compPositions.get(comp.id) ?? { x: ((comp.column ?? 1) - 1) * (COL_WIDTH + COLUMN_GAP), y: 0 };
    if (Array.isArray(comp.elements)) {
      const totalElementsHeight = (comp.elements.length * ELEMENT_H) + ((comp.elements.length - 1) * ELEMENT_GAP);
      const startY = parentPos.y + 60
      comp.elements.forEach((el, idx) => {
        const width = ELEMENT_W;
        const height = ELEMENT_H;
        const x = parentPos.x + (COL_WIDTH - width) / 2;
        const y = startY + (idx * (height + ELEMENT_GAP));
        elPositions.set(el.id, { x, y, width, height });
      });
    }
  }
  return elPositions;
}

export function computeCanvasSize(compPositions: Map<string, { x: number; y: number }>) {
  const maxX = Math.max(0, ...Array.from(compPositions.values()).map(p => p.x)) + COL_WIDTH + 120;
  const maxY = Math.max(0, ...Array.from(compPositions.values()).map(p => p.y)) + ROW_HEIGHT + 120;
  return { maxX, maxY };
}

