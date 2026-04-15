export type ImageType = 'menu' | 'logo' | 'banner' | 'receipt';

export interface PresignedUrlRequest {
  restaurantId: string;
  type: ImageType;
  contentType: string;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  key: string;
  publicUrl: string;
}

export interface StoragePort {
  generatePresignedUploadUrl(request: PresignedUrlRequest): Promise<PresignedUrlResponse>;
  deleteObject(key: string): Promise<void>;
}
