import type { MenuVisionPort, MenuVisionOutput } from '../../ports/menu-vision.port.js';
import type { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import { Result, ok, err } from '../../common/result.js';

export class AnalyzeMenuUseCase {
  constructor(
    private readonly vision: MenuVisionPort,
    private readonly restaurantRepo: RestaurantRepository,
  ) {}

  async execute(data: {
    restaurantId: string;
    imageBuffers: Buffer[];
    imageMimeTypes: string[];
    additionalText?: string;
  }): Promise<Result<MenuVisionOutput, Error>> {
    const restaurant = await this.restaurantRepo.findById(data.restaurantId);
    if (!restaurant) {
      return err(new Error('Restaurant not found'));
    }

    const result = await this.vision.analyzeMenu({
      imageBuffers: data.imageBuffers,
      imageMimeTypes: data.imageMimeTypes,
      additionalText: data.additionalText,
      currency: restaurant.currency,
    });

    return ok(result);
  }
}
