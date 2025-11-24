import { useRef } from "react";

export function useSidebarDrag({
  editorWidth,
  setEditorWidth,
  paletteWidth,
  setPaletteWidth,
}: {
  editorWidth: number;
  setEditorWidth: (w: number) => void;
  paletteWidth: number;
  setPaletteWidth: (w: number) => void;
}) {
    
  const dragState = useRef<{
    type: "editor" | "palette" | null;
    startX: number;
    startW: number;
  }>({ type: null, startX: 0, startW: 0 });

  const onDragStart = (type: "editor" | "palette", e: React.MouseEvent) => {
    dragState.current = {
      type,
      startX: e.clientX,
      startW: type === "editor" ? editorWidth : paletteWidth,
    };
    document.body.style.cursor = "col-resize";
    window.addEventListener("mousemove", onDragMove);
    window.addEventListener("mouseup", onDragEnd);
  };

  const onDragMove = (e: MouseEvent) => {
    if (dragState.current.type === "editor") {
      let w = Math.max(260, dragState.current.startW + (e.clientX - dragState.current.startX));
      setEditorWidth(w);
    }
    if (dragState.current.type === "palette") {
      let w = Math.max(180, dragState.current.startW - (e.clientX - dragState.current.startX));
      setPaletteWidth(w);
    }
  };

  const onDragEnd = () => {
    dragState.current.type = null;
    document.body.style.cursor = "";
    window.removeEventListener("mousemove", onDragMove);
    window.removeEventListener("mouseup", onDragEnd);
  };

  return { onDragStart };
}
