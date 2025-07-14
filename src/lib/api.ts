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
    }
  ) {
    try {
      const response = await fetch(`${this.baseUrl}/user-data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
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
}
