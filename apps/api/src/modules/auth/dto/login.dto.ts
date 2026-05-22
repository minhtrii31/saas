import { Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @Transform(({ value }: { value: unknown }) => normalizeEmailInput(value))
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

function normalizeEmailInput(value: unknown): unknown {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}
