import {
  Controller,
  Post,
  Body,
  Inject,
  BadRequestException,
  Logger,
  ServiceUnavailableException,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import {
  CurrentUser,
  RequestUser,
} from '../decorators/current-user.decorator.js';
import { Public } from '../decorators/public.decorator.js';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe.js';
import {
  ImportMenuRequestSchema,
  ImportMenuRequestDto,
} from '../request-dtos/onboarding.dto.js';
import type { AnalyzeMenuUseCase } from '../../application/use-cases/onboarding/analyze-menu.use-case.js';
import type { BulkImportMenuUseCase } from '../../application/use-cases/onboarding/bulk-import-menu.use-case.js';

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

@Controller('onboarding')
export class OnboardingController {
  private readonly logger = new Logger(OnboardingController.name);

  constructor(
    @Inject('AnalyzeMenuUseCase')
    private readonly analyzeMenu: AnalyzeMenuUseCase,
    @Inject('BulkImportMenuUseCase')
    private readonly bulkImport: BulkImportMenuUseCase,
  ) {}

  @Public()
  @Throttle({
    short: { limit: 3, ttl: 60_000 },
    medium: { limit: 10, ttl: 3_600_000 },
  })
  @Post('analyze')
  @UseInterceptors(
    FilesInterceptor('images', 4, {
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        cb(null, ALLOWED_MIMES.includes(file.mimetype));
      },
    }),
  )
  async analyze(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: { text?: string; currency?: string },
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException(
        'Subí al menos una foto de la carta (JPG, PNG o WebP).',
      );
    }

    const result = await this.analyzeMenu
      .execute({
        imageBuffers: files.map((f) => f.buffer),
        imageMimeTypes: files.map((f) => f.mimetype),
        additionalText: body.text || undefined,
        currency: body.currency || undefined,
      })
      .catch((error: unknown) => {
        this.logger.error(
          'Menu analysis failed',
          error instanceof Error ? error.stack : String(error),
        );
        throw new ServiceUnavailableException(
          'No pudimos leer la carta en este momento. Probá de nuevo en un rato o cargala a mano.',
        );
      });

    if (!result.ok) {
      throw new BadRequestException(result.error.message);
    }

    return result.value;
  }

  @Post('import')
  async importMenu(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(ImportMenuRequestSchema))
    body: ImportMenuRequestDto,
  ) {
    const result = await this.bulkImport.execute(user.restaurantId, body);
    if (!result.ok) {
      throw new BadRequestException(result.error);
    }
    return { success: true, counts: result.value };
  }
}
