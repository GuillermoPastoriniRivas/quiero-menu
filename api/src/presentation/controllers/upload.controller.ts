import { Controller, Post, Body, Inject, BadRequestException } from '@nestjs/common';
import { CurrentUser, RequestUser } from '../decorators/current-user.decorator.js';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe.js';
import { PresignedUrlRequestSchema, PresignedUrlRequestDto } from '../request-dtos/upload.dto.js';
import type { GenerateUploadUrlUseCase } from '../../application/use-cases/upload/generate-upload-url.use-case.js';

@Controller('uploads')
export class UploadController {
  constructor(
    @Inject('GenerateUploadUrlUseCase') private readonly generateUploadUrl: GenerateUploadUrlUseCase,
  ) {}

  @Post('presigned-url')
  async getPresignedUrl(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(PresignedUrlRequestSchema)) body: PresignedUrlRequestDto,
  ) {
    const result = await this.generateUploadUrl.execute({
      restaurantId: user.restaurantId,
      type: body.type,
      contentType: body.contentType,
    });
    if (!result.ok) throw new BadRequestException(result.error.message);
    return result.value;
  }
}
