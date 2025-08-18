import { useState, useEffect } from "react";

interface AppConfig {
  timeBlocks: {
    maxCount: number;
    defaultCount: number;
    currentCount: {
      public: number;
      admin: number;
    };
  };
  checklists: {
    masterChecklist: {
      maxCount: number;
      currentCount: {
        public: number;
        admin: number;
      };
    };
    habitBreakChecklist: {
      maxCount: number;
      currentCount: {
        public: number;
        admin: number;
      };
    };
  };
  todoList: {
    maxCount: number;
    defaultCount: number;
  };
}

export function useAppConfig() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchConfig() {
      try {
        setLoading(true);
        const response = await fetch("/api/config");

        if (!response.ok) {
          throw new Error("Failed to fetch configuration");
        }

        const data = await response.json();
        setConfig(data.config);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchConfig();
  }, []);

  const getTimeBlockCount = (
    userRole: "public" | "admin" | null = null
  ): number => {
    if (!config) return 18; // fallback

    if (userRole) {
      return config.timeBlocks.currentCount[userRole];
    }

    // Return the maximum of both if no user role specified
    return Math.max(
      config.timeBlocks.currentCount.public,
      config.timeBlocks.currentCount.admin
    );
  };

  const getChecklistCount = (
    type: "masterChecklist" | "habitBreakChecklist",
    userRole: "public" | "admin" | null = null
  ): number => {
    if (!config) return type === "masterChecklist" ? 18 : 8; // fallbacks

    if (userRole) {
      return config.checklists[type].currentCount[userRole];
    }

    // Return the maximum of both if no user role specified
    return Math.max(
      config.checklists[type].currentCount.public,
      config.checklists[type].currentCount.admin
    );
  };

  const getMaxCounts = () => {
    if (!config) {
      return {
        timeBlocks: 24,
        masterChecklist: 50,
        habitBreakChecklist: 20,
        todoList: 100,
      };
    }

    return {
      timeBlocks: config.timeBlocks.maxCount,
      masterChecklist: config.checklists.masterChecklist.maxCount,
      habitBreakChecklist: config.checklists.habitBreakChecklist.maxCount,
      todoList: config.todoList.maxCount,
    };
  };

  return {
    config,
    loading,
    error,
    getTimeBlockCount,
    getChecklistCount,
    getMaxCounts,
  };
}
