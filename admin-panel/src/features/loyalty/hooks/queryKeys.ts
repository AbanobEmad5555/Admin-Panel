export const loyaltyQueryKeys = {
  all: () => ["loyalty"] as const,
  settings: () => ["loyalty", "settings"] as const,
  summary: (filters: Record<string, unknown>) => ["loyalty", "summary", filters] as const,
  users: (params: Record<string, unknown>) => ["loyalty", "users", params] as const,
  overview: (filters: Record<string, unknown>) => ["loyalty", "overview", filters] as const,
  userSummary: (userId: number) => ["loyalty", "user-summary", userId] as const,
  userHistory: (userId: number, params: Record<string, unknown>) =>
    ["loyalty", "user-history", userId, params] as const,
};
