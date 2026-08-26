import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Inject,
  BadRequestException,
  NotFoundException,
  StreamableFile,
  Header,
} from '@nestjs/common';
import {
  CurrentUser,
  RequestUser,
} from '../decorators/current-user.decorator.js';
import { Public } from '../decorators/public.decorator.js';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe.js';
import {
  PresignedUrlRequestSchema,
  PresignedUrlRequestDto,
} from '../request-dtos/upload.dto.js';
import type { GenerateUploadUrlUseCase } from '../../application/use-cases/upload/generate-upload-url.use-case.js';
import type { StoragePort } from '../../application/ports/storage.port.js';

@Controller('uploads')
export class UploadController {
  constructor(
    @Inject('GenerateUploadUrlUseCase')
    private readonly generateUploadUrl: GenerateUploadUrlUseCase,
    @Inject('StoragePort')
    private readonly storage: StoragePort,
  ) {}

  @Post('presigned-url')
  async getPresignedUrl(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(PresignedUrlRequestSchema))
    body: PresignedUrlRequestDto,
  ) {
    const result = await this.generateUploadUrl.execute({
      restaurantId: user.restaurantId,
      type: body.type,
      contentType: body.contentType,
    });
    if (!result.ok) throw new BadRequestException(result.error.message);
    return result.value;
  }

  /**
   * Sirve una imagen del bucket con CORS habilitado para que la UI pueda
   * leerla (fetch -> data URL) aunque el CDN no mande Access-Control-Allow-Origin.
   * La key es el path completo dentro del bucket, ej: <restaurantId>/logo/<uuid>.webp
   */
  @Public()
  @Get('image/:key(*)')
  @Header('Access-Control-Allow-Origin', '*')
  @Header('Cache-Control', 'public, max-age=86400')
  async getImage(@Param('key') key: string) {
    if (!key || key.length > 200) {
      throw new BadRequestException('Invalid image key');
    }
    const object = await this.storage.getObject(key);
    if (!object) throw new NotFoundException('Image not found');
    return new StreamableFile(object.body, {
      type: object.contentType,
      disposition: 'inline',
    });
  }
}
