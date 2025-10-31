/**
 * Dynamic Configuration Service
 * Provides dynamic counts and configurations pulled from database templates
 */

import "server-only";
import { ContentTemplate, IContentTemplate } from "../models/ContentTemplate";
import { connectMongoose } from "./db";

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
    maxCount: 24, // Maximum allowed time blocks (24-hour system)
    defaultCount: 24, // Always 24 blocks (one per hour)
    currentCount: {
      public: 24,
      admin: 24,
    },
  },
  checklists: {
    masterChecklist: {
      maxCount: 50, // Maximum allowed checklist items
      currentCount: {
        public: 6, // Default public template items
        admin: 11, // Default admin template items
      },
    },
    habitBreakChecklist: {
      maxCount: 20, // Maximum allowed habit break items
      currentCount: {
        public: 4, // Default public template items
        admin: 5, // Default admin template items
      },
    },
  },
  todoList: {
    maxCount: 100, // Maximum allowed todo items
    defaultCount: 0, // Todos start empty
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
    await connectMongoose();

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
          public: 24, // Always 24 blocks (code-generated)
          admin: 24, // Always 24 blocks (code-generated)
        },
      },
      checklists: {
        masterChecklist: {
          ...DEFAULT_CONFIG.checklists.masterChecklist,
          currentCount: {
            public: publicTemplate?.content?.masterChecklist?.length || 6,
            admin: adminTemplate?.content?.masterChecklist?.length || 11,
          },
        },
        habitBreakChecklist: {
          ...DEFAULT_CONFIG.checklists.habitBreakChecklist,
          currentCount: {
            public: publicTemplate?.content?.habitBreakChecklist?.length || 4,
            admin: adminTemplate?.content?.habitBreakChecklist?.length || 5,
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
