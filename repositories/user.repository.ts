import { users, User } from "../data/data";

export function saveUser(userId: string, userInfo: User): void {
  users.set(userId, userInfo);
}

export function findUserById(userId: string): User | undefined {
  return users.get(userId);
}

export function deleteUser(userId: string): boolean {
  return users.delete(userId);
}
