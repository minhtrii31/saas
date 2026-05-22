import {
  IsInt,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';

export const supportedCvMimeTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export type SupportedCvMimeType = (typeof supportedCvMimeTypes)[number];

export const supportedStorageProviders = ['s3', 'cloudinary'] as const;

export type SupportedStorageProvider =
  (typeof supportedStorageProviders)[number];

export class CreateCvDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  originalName!: string;

  @IsIn(supportedCvMimeTypes)
  mimeType!: SupportedCvMimeType;

  @IsInt()
  @Min(1)
  sizeBytes!: number;

  @IsString()
  @IsNotEmpty()
  @IsIn(supportedStorageProviders)
  storageProvider!: SupportedStorageProvider;

  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  storageKey!: string;

  @IsOptional()
  @IsString()
  @IsUrl({ require_protocol: true })
  storageUrl?: string;
}
