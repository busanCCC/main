import { useState } from "react";
import WorshipOrderSection from "../components/WorshipOrderSection";
import MainSection from "../components/MainSection";
import AnnouncementSection from "../components/AnnouncementSection";
import NewsSection from "../components/NewsSection";
import Header from "../components/ui/Header";

async function getPost(id: string) {
  const res = await fetch(`http://localhost:3000/api/posts/${id}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Failed to fetch post");
  }
  return res.json();
}
export default async function Main({ params }: { params: { id: string } }) {
  const post = await getPost(params.id);

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
