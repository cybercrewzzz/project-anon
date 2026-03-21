import {
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  IsArray,
  ArrayNotEmpty,
} from 'class-validator';

export class UpdateAccountDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(64)
  name?: string;

  @IsOptional()
  @IsString()
  interfaceLanguageId?: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  languageIds?: string[];
}
