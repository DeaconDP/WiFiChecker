import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { fetchRoadmap } from "../api";

export default function RoadmapPage() {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoadmap()
      .then(setContent)
      .catch(() => setContent("# Roadmap\n\nUnable to load roadmap."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="empty-state">
        <div className="empty-symbol">▤</div>
        <p>Loading roadmap…</p>
      </div>
    );
  }

  return (
    <div className="roadmap-content">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
