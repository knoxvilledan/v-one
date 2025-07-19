// Maintenance mode configuration
// This will read from environment variable, defaulting to true for safety
export const MAINTENANCE_MODE = 
  process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true' || 
  process.env.NODE_ENV === 'production'; // Default to maintenance in production

// To disable maintenance mode:
// 1. Set NEXT_PUBLIC_MAINTENANCE_MODE=false in your .env.local
// 2. Or manually set the line above to: export const MAINTENANCE_MODE = false;
