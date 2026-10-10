/** Mongo filter for projects a user can see: ones they own OR were added to as a member. */
export const projectAccess = (userId: unknown): Record<string, unknown> => ({
  $or: [{ owner: userId }, { members: userId }],
});