import React, { useState } from "react";
import { useStore } from "../../store/store";
import ComponentInfos from "./ComponentInfos";
import ElementsInfos from "./ElementsInfos";

export default function Properties() {
  const selectedId = useStore((s) => s.selectedId);
  const model = useStore((s) => s.model);



  // Find selected component or element
  const comp = model.components.find((c) => c.id === selectedId);
  let el = null;
  let parentComp = null;
  if (!comp && selectedId) {
    for (const c of model.components) {
      el = (c.elements || []).find((e) => e.id === selectedId);
      if (el) {
        parentComp = c;
        break;
      }
    }
  }


  if (comp) {
    return <ComponentInfos comp={comp} />;
  }

  if (el) {
    return <ElementsInfos el={el} parentComp={parentComp} />;
  }

  return null;
}
