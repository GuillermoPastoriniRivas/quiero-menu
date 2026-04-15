import { User } from '../entities/user.entity.js';

export interface UserRepository {
  create(data: Omit<User, 'id' | 'createdAt'>): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  updatePasswordHash(id: string, passwordHash: string): Promise<User | null>;
  updateEmailVerified(id: string, emailVerified: boolean): Promise<User | null>;
}
