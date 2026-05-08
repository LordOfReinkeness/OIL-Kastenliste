export const config = {
  rateLimit: {
    defaultTtlMs: 60_000,
    defaultLimit: 60,
    writeTtlMs:   60_000,
    writeLimit:   10,
  },
} as const;
