export const queryKeys = {
  /**
   * Profile information for a given user.
   * Usage: queryClient.invalidateQueries({ queryKey: queryKeys.profile(userId) })
   */
  profile: (userId?: string | null) => ["profile", userId] as const,

  /**
   * Onboarding/checklist status for a given user.
   */
  onboardingStatus: (userId?: string | null) => ["onboardingStatus", userId] as const,

  /**
   * All personas that belong to a given user.
   */
  personas: (userId?: string | null) => ["personas", userId] as const,
} 