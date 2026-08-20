import type {
  MenuVisionPort,
  MenuVisionOutput,
} from '../../ports/menu-vision.port.js';
import { Result, ok } from '../../common/result.js';

export class AnalyzeMenuUseCase {
  constructor(private readonly vision: MenuVisionPort) {}

  async execute(data: {
    imageBuffers: Buffer[];
    imageMimeTypes: string[];
    additionalText?: string;
    currency?: string;
  }): Promise<Result<MenuVisionOutput, Error>> {
    const result = await this.vision.analyzeMenu({
      imageBuffers: data.imageBuffers,
      imageMimeTypes: data.imageMimeTypes,
      additionalText: data.additionalText,
      currency: data.currency || 'ARS',
    });

    return ok(result);
  }
}
