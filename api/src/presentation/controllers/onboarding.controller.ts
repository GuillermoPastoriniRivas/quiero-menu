import {
  Controller,
  Post,
  Body,
  Inject,
  BadRequestException,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CurrentUser, RequestUser } from '../decorators/current-user.decorator.js';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe.js';
import { ImportMenuRequestSchema, ImportMenuRequestDto } from '../request-dtos/onboarding.dto.js';
import type { AnalyzeMenuUseCase } from '../../application/use-cases/onboarding/analyze-menu.use-case.js';
import type { BulkImportMenuUseCase } from '../../application/use-cases/onboarding/bulk-import-menu.use-case.js';

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

@Controller('onboarding')
export class OnboardingController {
  constructor(
    @Inject('AnalyzeMenuUseCase') private readonly analyzeMenu: AnalyzeMenuUseCase,
    @Inject('BulkImportMenuUseCase') private readonly bulkImport: BulkImportMenuUseCase,
  ) {}

  @Post('analyze')
  @UseInterceptors(
    FilesInterceptor('images', 2, {
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        cb(null, ALLOWED_MIMES.includes(file.mimetype));
      },
    }),
  )
  async analyze(
    @CurrentUser() user: RequestUser,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: { text?: string },
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one menu image is required');
    }

    const result = await this.analyzeMenu.execute({
      restaurantId: user.restaurantId,
      imageBuffers: files.map((f) => f.buffer),
      imageMimeTypes: files.map((f) => f.mimetype),
      additionalText: body.text || undefined,
    });

    if (!result.ok) {
      throw new BadRequestException(result.error.message);
    }

    return result.value;
  }

  @Post('import')
  async importMenu(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(ImportMenuRequestSchema)) body: ImportMenuRequestDto,
  ) {
    const result = await this.bulkImport.execute(user.restaurantId, body);
    if (!result.ok) {
      throw new BadRequestException(result.error);
    }
    return { success: true, counts: result.value };
  }
}
