export type FeaturedScope = 'category' | 'home';

export class FeaturedSlot {
  constructor(
    public readonly id: string,
    public readonly restaurantId: string,
    public readonly scope: FeaturedScope,
    /** Ciudad donde destaca (slug). */
    public readonly citySlug: string,
    /** Solo scope category: rubro donde destaca. */
    public readonly category: string,
    public readonly startsAt: Date,
    public readonly endsAt: Date,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
  ) {}
}
