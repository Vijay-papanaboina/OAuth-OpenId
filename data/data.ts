export interface User {
  id: string;
  provider: string;
  username: string;
  email: string | null;
  avatar: string | null;
  raw: Record<string, any>; // All original provider data
}

const code_verification = new Map<
  string,
  { code_verifier: string; state?: string }
>();

// Store authenticated users by userId
const users = new Map<string, User>();

export { code_verification, users };
