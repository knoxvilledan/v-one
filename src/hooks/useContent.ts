import { useState, useEffect } from "react";
import { ContentTemplate, UserRole } from "../types/content";

interface ContentData {
  content: ContentTemplate["content"];
  userRole: UserRole;
}

export function useContent() {
  const [contentData, setContentData] = useState<ContentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchContent() {
      try {
        setLoading(true);
        const response = await fetch("/api/content");

        if (!response.ok) {
          throw new Error("Failed to fetch content");
        }

        const data = await response.json();
        setContentData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchContent();
  }, []);

  const refreshContent = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/content");

      if (!response.ok) {
        throw new Error("Failed to fetch content");
      }

      const data = await response.json();
      setContentData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return {
    contentData,
    loading,
    error,
    refreshContent,
  };
}
