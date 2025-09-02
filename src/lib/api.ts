// API service for frontend to interact with backend
import { Block, ChecklistItem } from "../types";

export class ApiService {
  private static baseUrl = "/api";

  // Save user data to MongoDB
  static async saveDayData(
    email: string,
    date: string,
    dayData: {
      wakeTime: string;
      blocks: Block[];
      masterChecklist: ChecklistItem[];
      habitBreakChecklist: ChecklistItem[];
      todoList?: ChecklistItem[];
    }
  ) {
    try {
      const response = await fetch(`${this.baseUrl}/user-data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date,
          ...dayData,
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error saving data:", error);
      throw error;
    }
  }

  // Load user data from MongoDB
  static async getUserData(email: string) {
    try {
      const response = await fetch(`${this.baseUrl}/user-data?email=${email}`);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error("Error loading data:", error);
      throw error;
    }
  }

  // Load specific day data
  static async loadDayData(email: string, date: string) {
    try {
      const userData = await this.getUserData(email);
      return userData.days[date] || null;
    } catch (error) {
      console.error("Error loading day data:", error);
      throw error;
    }
  }

  // Register a new user
  static async registerUser(name: string, email: string, password: string) {
    try {
      const response = await fetch(`${this.baseUrl}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Registration failed");
      }

      return await response.json();
    } catch (error) {
      console.error("Error registering user:", error);
      throw error;
    }
  }

  // TimeBlocks API methods

  // Update a single time block label for a user
  static async updateTimeBlockLabel(
    targetBlockId: string,
    label: string,
    date: string
  ) {
    try {
      const response = await fetch(`${this.baseUrl}/timeblocks/user`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetBlockId,
          label,
          date,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update time block label");
      }

      return await response.json();
    } catch (error) {
      console.error("Error updating time block label:", error);
      throw error;
    }
  }

  // Get time blocks for a user on a specific date
  static async getUserTimeBlocks(date: string) {
    try {
      const response = await fetch(
        `${this.baseUrl}/timeblocks/user?date=${date}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get time blocks");
      }

      return await response.json();
    } catch (error) {
      console.error("Error getting time blocks:", error);
      throw error;
    }
  }

  // Bulk update multiple time block labels for a user
  static async bulkUpdateTimeBlockLabels(
    updates: Array<{ targetBlockId: string; label: string }>,
    date: string
  ) {
    try {
      const response = await fetch(`${this.baseUrl}/timeblocks/bulk`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          updates,
          date,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to bulk update time blocks");
      }

      return await response.json();
    } catch (error) {
      console.error("Error bulk updating time blocks:", error);
      throw error;
    }
  }

  // Create day data from template
  static async createDayFromTemplate(
    date: string,
    useTemplate?: "public" | "admin"
  ) {
    try {
      const response = await fetch(`${this.baseUrl}/timeblocks/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date,
          useTemplate,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to create day from template"
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating day from template:", error);
      throw error;
    }
  }

  // Admin-only methods for template management

  // Update time block template (admin only)
  static async updateTimeBlockTemplate(
    targetBlockId: string,
    label: string,
    targetRole: "public" | "admin",
    time?: string
  ) {
    try {
      const response = await fetch(`${this.baseUrl}/timeblocks/templates`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetBlockId,
          label,
          targetRole,
          time,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to update time block template"
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error updating time block template:", error);
      throw error;
    }
  }

  // Get time block templates (admin only)
  static async getTimeBlockTemplates(role: "public" | "admin") {
    try {
      const response = await fetch(
        `${this.baseUrl}/timeblocks/templates?role=${role}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to get time block templates"
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error getting time block templates:", error);
      throw error;
    }
  }

  // Add time block to template (admin only)
  static async addTimeBlockToTemplate(
    label: string,
    time: string,
    targetRole: "public" | "admin",
    insertAfterIndex?: number
  ) {
    try {
      const response = await fetch(`${this.baseUrl}/timeblocks/templates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          label,
          time,
          targetRole,
          insertAfterIndex,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to add time block to template"
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error adding time block to template:", error);
      throw error;
    }
  }

  // Remove time block from template (admin only)
  static async removeTimeBlockFromTemplate(
    targetBlockId: string,
    targetRole: "public" | "admin"
  ) {
    try {
      const response = await fetch(`${this.baseUrl}/timeblocks/templates`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetBlockId,
          targetRole,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to remove time block from template"
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error removing time block from template:", error);
      throw error;
    }
  }

  // Hydration API - Get complete user state
  static async hydrateUserData(targetDate?: string) {
    try {
      const url = targetDate
        ? `${this.baseUrl}/hydrate?date=${targetDate}`
        : `${this.baseUrl}/hydrate`;

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to hydrate user data");
      }

      return await response.json();
    } catch (error) {
      console.error("Error hydrating user data:", error);
      throw error;
    }
  }

  // Force refresh user data for a specific date
  static async refreshUserData(targetDate?: string, forceRefresh = false) {
    try {
      const response = await fetch(`${this.baseUrl}/hydrate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetDate,
          forceRefresh,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to refresh user data");
      }

      return await response.json();
    } catch (error) {
      console.error("Error refreshing user data:", error);
      throw error;
    }
  }
}
