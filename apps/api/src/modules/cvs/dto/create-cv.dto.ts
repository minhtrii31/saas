import {
  IsInt,
  IsMimeType,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateCvDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsString()
  @IsNotEmpty()
  originalName!: string;

  @IsMimeType()
  mimeType!: string;

  @IsInt()
  @Min(0)
  sizeBytes!: number;

  @IsString()
  @IsNotEmpty()
  storageProvider!: string;

  @IsString()
  @IsNotEmpty()
  storageKey!: string;

  @IsOptional()
  @IsString()
  storageUrl?: string;
}
