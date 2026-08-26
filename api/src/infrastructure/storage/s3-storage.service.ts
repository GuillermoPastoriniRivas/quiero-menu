import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import type {
  StoragePort,
  PresignedUrlRequest,
  PresignedUrlResponse,
  StoredObject,
} from '../../application/ports/storage.port.js';

const EXTENSION_MAP: Record<string, string> = {
  'image/webp': 'webp',
  'image/png': 'png',
  'image/jpeg': 'jpg',
};

@Injectable()
export class S3StorageService implements StoragePort {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly cloudfrontDomain: string;

  constructor(config: ConfigService) {
    this.bucket = config.get<string>('s3.bucket')!;
    this.cloudfrontDomain = config.get<string>('s3.cloudfrontDomain')!;
    this.client = new S3Client({ region: config.get<string>('s3.region')! });
  }

  async generatePresignedUploadUrl(
    req: PresignedUrlRequest,
  ): Promise<PresignedUrlResponse> {
    const ext = EXTENSION_MAP[req.contentType] ?? 'jpg';
    const key = `${req.restaurantId}/${req.type}/${randomUUID()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: req.contentType,
    });

    const uploadUrl = await getSignedUrl(this.client, command, {
      expiresIn: 300,
    });

    return {
      uploadUrl,
      key,
      publicUrl: `https://${this.cloudfrontDomain}/${key}`,
    };
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  async getObject(key: string): Promise<StoredObject | null> {
    let result;
    try {
      result = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      );
    } catch (error) {
      const name = (error as { name?: string })?.name;
      if (name === 'NoSuchKey' || name === 'NotFound') return null;
      throw error;
    }

    const body = result.Body as unknown;
    if (!body) return null;

    let bytes: Uint8Array;
    const withTransform = body as {
      transformToByteArray?: () => Promise<Uint8Array>;
    };
    if (typeof withTransform.transformToByteArray === 'function') {
      bytes = await withTransform.transformToByteArray();
    } else {
      bytes = await new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        const stream = body as NodeJS.ReadableStream;
        stream.on('data', (chunk: Buffer | string) =>
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)),
        );
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
      });
    }

    return {
      body: Buffer.from(bytes),
      contentType: result.ContentType ?? 'application/octet-stream',
    };
  }
}
