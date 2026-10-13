import { User } from '../entities/user.entity.js';

export interface UserNotificationPreferences {
  notifyEmail?: boolean;
  notifyWhatsapp?: boolean;
}

export type NewUser = Omit<
  User,
  'id' | 'createdAt' | 'notifyEmail' | 'notifyWhatsapp'
> & {
  notifyEmail?: boolean;
  notifyWhatsapp?: boolean;
};

export interface UserRepository {
  create(data: NewUser): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  searchByEmail(term: string, limit: number): Promise<User[]>;
  updatePasswordHash(id: string, passwordHash: string): Promise<User | null>;
  updateEmailVerified(id: string, emailVerified: boolean): Promise<User | null>;
  updateNotificationPreferences(
    id: string,
    prefs: UserNotificationPreferences,
  ): Promise<User | null>;
  delete(id: string): Promise<boolean>;
}
