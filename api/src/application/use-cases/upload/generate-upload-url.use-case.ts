import type { StoragePort, PresignedUrlResponse, ImageType } from '../../ports/storage.port.js';
import { Result, ok, err } from '../../common/result.js';

const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_IMAGE_TYPES: ImageType[] = ['menu', 'logo', 'banner', 'receipt'];

export class GenerateUploadUrlUseCase {
  constructor(private readonly storage: StoragePort) {}

  async execute(data: {
    restaurantId: string;
    type: ImageType;
    contentType: string;
  }): Promise<Result<PresignedUrlResponse, Error>> {
    if (!ALLOWED_CONTENT_TYPES.includes(data.contentType)) {
      return err(new Error('Invalid content type. Allowed: image/jpeg, image/png, image/webp'));
    }

    if (!ALLOWED_IMAGE_TYPES.includes(data.type)) {
      return err(new Error('Invalid image type'));
    }

    const result = await this.storage.generatePresignedUploadUrl({
      restaurantId: data.restaurantId,
      type: data.type,
      contentType: data.contentType,
    });

    return ok(result);
  }
}
