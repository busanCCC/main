"use client";

import { useState } from "react";

// Accordion 로직을 재사용할 수 있도록 Hooks로 정의
export function useAccordion(defaultActive: string[] = []) {
  const [activeIndexes, setActiveIndexes] = useState<Set<string>>(
    new Set(defaultActive)
  );

  const toggleAccordion = (index: string) => {
    const newActiveIndexes = new Set(activeIndexes);
    if (newActiveIndexes.has(index)) {
      newActiveIndexes.delete(index);
    } else {
      newActiveIndexes.add(index);
    }
    setActiveIndexes(newActiveIndexes);
  };

  return { activeIndexes, toggleAccordion };
}
