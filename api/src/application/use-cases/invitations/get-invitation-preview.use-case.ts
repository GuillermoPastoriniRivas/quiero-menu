import { InvitationRepository } from '../../../domain/repositories/invitation.repository.js';
import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import { MenuCategoryRepository } from '../../../domain/repositories/menu-category.repository.js';
import { MenuItemRepository } from '../../../domain/repositories/menu-item.repository.js';
import { OperatingHoursRepository } from '../../../domain/repositories/operating-hours.repository.js';
import { InvitationStatus } from '../../../domain/entities/invitation.entity.js';
import { Result, ok, err } from '../../common/result.js';
import { InvitationNotFoundError } from '../../../domain/errors/domain-errors.js';
import { hashInvitationToken } from './invitation-token.js';

export interface InvitationPreview {
  status: InvitationStatus;
  expiresAt: Date;
  emailHint: string | null;
  restaurant: {
    name: string;
    slug: string;
    description: string;
    city: string;
    category: string;
    logoUrl: string;
    bannerUrl: string;
    photos: string[];
    categories: number;
    items: number;
    hasHours: boolean;
  };
}

function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  if (!domain) return email;
  const visible = user.slice(0, Math.min(2, user.length));
  return `${visible}${'•'.repeat(Math.max(user.length - visible.length, 1))}@${domain}`;
}

export class GetInvitationPreviewUseCase {
  constructor(
    private readonly invitationRepo: InvitationRepository,
    private readonly restaurantRepo: RestaurantRepository,
    private readonly categoryRepo: MenuCategoryRepository,
    private readonly itemRepo: MenuItemRepository,
    private readonly hoursRepo: OperatingHoursRepository,
  ) {}

  async execute(
    rawToken: string,
  ): Promise<Result<InvitationPreview, InvitationNotFoundError>> {
    const invitation = await this.invitationRepo.findByTokenHash(
      hashInvitationToken(rawToken),
    );
    if (!invitation) return err(new InvitationNotFoundError());

    const restaurant = await this.restaurantRepo.findById(
      invitation.restaurantId,
    );
    if (!restaurant) return err(new InvitationNotFoundError());

    const [categories, items, hours] = await Promise.all([
      this.categoryRepo.findByRestaurantId(restaurant.id),
      this.itemRepo.findByRestaurantId(restaurant.id),
      this.hoursRepo.findByRestaurantId(restaurant.id),
    ]);

    return ok({
      status: invitation.statusAt(new Date()),
      expiresAt: invitation.expiresAt,
      emailHint: invitation.email ? maskEmail(invitation.email) : null,
      restaurant: {
        name: restaurant.name,
        slug: restaurant.slug,
        description: restaurant.description,
        city: restaurant.city,
        category: restaurant.category ?? '',
        logoUrl: restaurant.logoUrl,
        bannerUrl: restaurant.bannerUrl,
        photos: (restaurant.photoGallery ?? []).slice(0, 4).map((p) => p.url),
        categories: categories.filter((c) => c.isVisible).length,
        items: items.filter((i) => i.isVisible).length,
        hasHours: hours.some((h) => !h.isClosed),
      },
    });
  }
}
