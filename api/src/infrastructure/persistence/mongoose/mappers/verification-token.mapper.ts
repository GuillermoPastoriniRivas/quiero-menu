import { VerificationToken, TokenType } from '../../../../domain/entities/verification-token.entity.js';
import { VerificationTokenDocument } from '../schemas/verification-token.schema.js';

export class VerificationTokenMapper {
  static toDomain(doc: VerificationTokenDocument): VerificationToken {
    return new VerificationToken(
      doc._id.toHexString(),
      doc.userId.toHexString(),
      doc.tokenHash,
      doc.type as TokenType,
      doc.expiresAt,
      doc.createdAt,
    );
  }
}
