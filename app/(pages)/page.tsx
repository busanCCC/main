"use client";
import { useState } from "react";
import WorshipOrderSection from "../components/WorshipOrderSection";
import MainSection from "../components/MainSection";
import AnnouncementSection from "../components/AnnouncementSection";
import NewsSection from "../components/NewsSection";
import Header from "../components/ui/Header";

export default function Main() {
  const [activeIndexes, setActiveIndexes] = useState<Set<string>>(
    new Set(["announcement", "order", "news"])
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

  return (
    <div className="w-full h-full overflow-y-auto">
      <Header />
      <MainSection />
      <WorshipOrderSection
        activeIndexes={activeIndexes}
        toggleAccordion={toggleAccordion}
      />
      <AnnouncementSection
        activeIndexes={activeIndexes}
        toggleAccordion={toggleAccordion}
      />
      <NewsSection
        activeIndexes={activeIndexes}
        toggleAccordion={toggleAccordion}
      />
    </div>
  );
}
