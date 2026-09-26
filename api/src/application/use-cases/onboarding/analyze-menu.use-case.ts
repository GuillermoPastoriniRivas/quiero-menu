import type {
  MenuVisionPort,
  MenuVisionOutput,
} from '../../ports/menu-vision.port.js';
import { Result, ok, err } from '../../common/result.js';

export class MenuNotRecognizedError extends Error {
  constructor() {
    super(
      'No encontramos platos en la foto. Probá con una foto más nítida y de frente, o cargá la carta a mano.',
    );
  }
}

export class AnalyzeMenuUseCase {
  constructor(private readonly vision: MenuVisionPort) {}

  async execute(data: {
    imageBuffers: Buffer[];
    imageMimeTypes: string[];
    additionalText?: string;
    currency?: string;
  }): Promise<Result<MenuVisionOutput, MenuNotRecognizedError>> {
    const result = await this.vision.analyzeMenu({
      imageBuffers: data.imageBuffers,
      imageMimeTypes: data.imageMimeTypes,
      additionalText: data.additionalText,
      currency: data.currency || 'ARS',
    });

    const hasItems = (result.categories ?? []).some(
      (category) => (category.items ?? []).length > 0,
    );
    if (!hasItems) return err(new MenuNotRecognizedError());

    return ok(result);
  }
}
