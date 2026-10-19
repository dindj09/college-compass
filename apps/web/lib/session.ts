/**
 * Session abstraction — auth-ready.
 *
 * Currently returns a static local user with no authentication.
 * To add auth (NextAuth, Clerk, Supabase, etc.):
 *   1. Replace getSession() with your auth provider's session getter.
 *   2. Replace SessionUser with your auth provider's user type.
 *   3. The rest of the app calls getSession() and works unchanged.
 */

export interface SessionUser {
  id: string;
  name?: string;
  email?: string;
}

export interface Session {
  user: SessionUser;
}

/**
 * Server-side session getter.
 * Currently returns a static local user — swap this for real auth later.
 */
export async function getSession(): Promise<Session> {
  return {
    user: {
      id: "local",
      name: "Student",
    },
  };
}

/**
 * Returns the user id for the current session.
 * Use this as the key for profile storage.
 */
export async function getCurrentUserId(): Promise<string> {
  const session = await getSession();
  return session.user.id;
}
