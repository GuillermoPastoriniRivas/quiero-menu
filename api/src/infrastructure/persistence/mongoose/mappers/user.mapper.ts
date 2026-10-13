import { User } from '../../../../domain/entities/user.entity.js';
import { UserDocument } from '../schemas/user.schema.js';

export class UserMapper {
  static toDomain(doc: UserDocument): User {
    return new User(
      doc._id.toHexString(),
      doc.email,
      doc.passwordHash,
      doc.name,
      doc.emailVerified ?? false,
      doc.createdAt,
      doc.notifyEmail ?? true,
      doc.notifyWhatsapp ?? false,
    );
  }
}
