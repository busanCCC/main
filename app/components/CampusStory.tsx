import { supabase } from "@/api/supabase";
import { useEffect, useState } from "react";
import NewsYoutube from "./news/NewsYoutube";

type Story = {
  id: number;
  title: string;
  created_at: string | null;
  description: string | null;
  youtube_url: string | null;
};

export default function CampusStory() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const { data, error } = await supabase
          .from("videos")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          throw new Error(error.message);
        }

        setStories(data);
        setLoading(false);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("unknown Error");
        }
        setLoading(false);
      }
    };
    fetchStories();
  }, []);

  if (loading) {
    return <div>loading</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {stories.map((story) => (
        <div
          key={story.id}
          className="bg-white rounded-md shadow p-4 flex flex-col"
        >
          <p className="text-xl">{story.title}</p>
          {story.youtube_url && (
            <div className="mt-2 aspect-video w-full">
              <NewsYoutube youtubeId={story.youtube_url} />
            </div>
          )}
          <p className="text-sm pt-4 w-10/12 mx-auto">{story.description}</p>
        </div>
      ))}
    </div>
  );
}
