export type UserLike = { id: string; name: string; email: string; avatar?: string | null };

/** The only user fields other people are allowed to see. */
export const publicUser = (u: UserLike) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  avatar: u.avatar || undefined,
});