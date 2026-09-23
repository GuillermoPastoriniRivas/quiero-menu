import { InvitationRepository } from '../../../domain/repositories/invitation.repository.js';
import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import { EmailServicePort } from '../../ports/email-service.port.js';
import { Result, ok, err } from '../../common/result.js';
import { RestaurantNotFoundError } from '../../../domain/errors/domain-errors.js';
import { invitationTemplate } from '../../../infrastructure/email/templates/invitation.template.js';
import {
  INVITATION_TTL_DAYS,
  generateInvitationToken,
  invitationUrl,
} from './invitation-token.js';

export interface CreateInvitationInput {
  restaurantId: string;
  adminUserId: string;
  email?: string | null;
  sendEmail?: boolean;
}

export interface CreateInvitationOutput {
  id: string;
  url: string;
  email: string | null;
  expiresAt: Date;
  emailSent: boolean;
}

export class CreateInvitationUseCase {
  constructor(
    private readonly invitationRepo: InvitationRepository,
    private readonly restaurantRepo: RestaurantRepository,
    private readonly emailService: EmailServicePort,
    private readonly frontendUrl: string,
  ) {}

  async execute(
    input: CreateInvitationInput,
  ): Promise<Result<CreateInvitationOutput, RestaurantNotFoundError>> {
    const restaurant = await this.restaurantRepo.findById(input.restaurantId);
    if (!restaurant) return err(new RestaurantNotFoundError());

    await this.invitationRepo.revokeOpenByRestaurantId(restaurant.id);

    const token = generateInvitationToken();
    const email = input.email?.trim() || null;
    const invitation = await this.invitationRepo.create({
      restaurantId: restaurant.id,
      tokenHash: token.hash,
      email,
      createdBy: input.adminUserId,
      expiresAt: new Date(Date.now() + INVITATION_TTL_DAYS * 86_400_000),
    });

    const url = invitationUrl(this.frontendUrl, token.raw);

    let emailSent = false;
    if (email && input.sendEmail) {
      emailSent = await this.emailService
        .send({
          to: email,
          subject: `${restaurant.name} ya está en quiero.menu: quedátelo`,
          html: invitationTemplate(restaurant.name, url, INVITATION_TTL_DAYS),
        })
        .then(() => true)
        .catch(() => false);
    }

    return ok({
      id: invitation.id,
      url,
      email,
      expiresAt: invitation.expiresAt,
      emailSent,
    });
  }
}
