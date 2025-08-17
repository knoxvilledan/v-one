/**
 * Dynamic Configuration Service
 * Provides dynamic counts and configurations pulled from database templates
 */

import { ContentTemplate, IContentTemplate } from "../models/ContentTemplate";
import dbConnect from "./dbConnect";

export interface AppConfig {
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

// Default configuration values
const DEFAULT_CONFIG: AppConfig = {
  timeBlocks: {
    maxCount: 24, // Allow up to 24 time blocks
    defaultCount: 18,
    currentCount: {
      public: 18,
      admin: 18,
    },
  },
  checklists: {
    masterChecklist: {
      maxCount: 50, // Allow up to 50 checklist items
      currentCount: {
        public: 10,
        admin: 10,
      },
    },
    habitBreakChecklist: {
      maxCount: 20, // Allow up to 20 habit items
      currentCount: {
        public: 5,
        admin: 5,
      },
    },
  },
  todoList: {
    maxCount: 100, // Allow up to 100 todo items
    defaultCount: 20,
  },
};

let cachedConfig: AppConfig | null = null;
let lastConfigUpdate = 0;
const CONFIG_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get the current application configuration from database templates
 */
export async function getAppConfig(forceRefresh = false): Promise<AppConfig> {
  const now = Date.now();

  // Return cached config if still valid
  if (
    !forceRefresh &&
    cachedConfig &&
    now - lastConfigUpdate < CONFIG_CACHE_DURATION
  ) {
    return cachedConfig;
  }

  try {
    await dbConnect();

    // Get both public and admin templates
    const [publicTemplate, adminTemplate] = await Promise.all([
      ContentTemplate.findOne({ userRole: "public" }).lean<IContentTemplate>(),
      ContentTemplate.findOne({ userRole: "admin" }).lean<IContentTemplate>(),
    ]);

    const config: AppConfig = {
      ...DEFAULT_CONFIG,
      timeBlocks: {
        ...DEFAULT_CONFIG.timeBlocks,
        currentCount: {
          public:
            publicTemplate?.content?.timeBlocks?.length ||
            DEFAULT_CONFIG.timeBlocks.defaultCount,
          admin:
            adminTemplate?.content?.timeBlocks?.length ||
            DEFAULT_CONFIG.timeBlocks.defaultCount,
        },
      },
      checklists: {
        masterChecklist: {
          ...DEFAULT_CONFIG.checklists.masterChecklist,
          currentCount: {
            public: publicTemplate?.content?.masterChecklist?.length || 5,
            admin: adminTemplate?.content?.masterChecklist?.length || 5,
          },
        },
        habitBreakChecklist: {
          ...DEFAULT_CONFIG.checklists.habitBreakChecklist,
          currentCount: {
            public: publicTemplate?.content?.habitBreakChecklist?.length || 3,
            admin: adminTemplate?.content?.habitBreakChecklist?.length || 3,
          },
        },
      },
    };

    // Cache the configuration
    cachedConfig = config;
    lastConfigUpdate = now;

    return config;
  } catch (error) {
    console.error("Error fetching app configuration:", error);
    // Return default config on error
    return DEFAULT_CONFIG;
  }
}

/**
 * Get time block count for a specific user role
 */
export async function getTimeBlockCount(
  userRole: "public" | "admin" | null = null
): Promise<number> {
  if (userRole) {
    const config = await getAppConfig();
    return config.timeBlocks.currentCount[userRole];
  }

  // If no user role specified, return the maximum of both
  const config = await getAppConfig();
  return Math.max(
    config.timeBlocks.currentCount.public,
    config.timeBlocks.currentCount.admin
  );
}

/**
 * Get checklist count for a specific user role and checklist type
 */
export async function getChecklistCount(
  type: "masterChecklist" | "habitBreakChecklist",
  userRole: "public" | "admin" | null = null
): Promise<number> {
  const config = await getAppConfig();

  if (userRole) {
    return config.checklists[type].currentCount[userRole];
  }

  // If no user role specified, return the maximum of both
  return Math.max(
    config.checklists[type].currentCount.public,
    config.checklists[type].currentCount.admin
  );
}

/**
 * Generate time block indices array dynamically
 */
export async function getTimeBlockIndices(
  userRole: "public" | "admin" | null = null
): Promise<number[]> {
  const count = await getTimeBlockCount(userRole);
  return Array.from({ length: count }, (_, i) => i);
}

/**
 * Check if a time block index is valid for a given user role
 */
export async function isValidTimeBlockIndex(
  index: number,
  userRole: "public" | "admin" | null = null
): Promise<boolean> {
  const count = await getTimeBlockCount(userRole);
  return index >= 0 && index < count;
}

/**
 * Invalidate the configuration cache (call when templates are updated)
 */
export function invalidateConfigCache(): void {
  cachedConfig = null;
  lastConfigUpdate = 0;
}

/**
 * Get maximum allowed counts for validation
 */
export function getMaxCounts() {
  return {
    timeBlocks: DEFAULT_CONFIG.timeBlocks.maxCount,
    masterChecklist: DEFAULT_CONFIG.checklists.masterChecklist.maxCount,
    habitBreakChecklist: DEFAULT_CONFIG.checklists.habitBreakChecklist.maxCount,
    todoList: DEFAULT_CONFIG.todoList.maxCount,
  };
}
