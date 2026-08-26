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
    try {
      const result = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      const bytes = await result.Body?.transformToByteArray();
      if (!bytes) return null;
      return {
        body: Buffer.from(bytes),
        contentType: result.ContentType ?? 'application/octet-stream',
      };
    } catch (error) {
      const name = (error as { name?: string })?.name;
      if (name === 'NoSuchKey') return null;
      throw error;
    }
  }
}
