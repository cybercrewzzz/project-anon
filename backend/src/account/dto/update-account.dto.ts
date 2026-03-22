import {
  IsString,
  IsOptional,
  IsUUID,
  IsArray,
  MaxLength,
} from 'class-validator';

export class UpdateAccountDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsUUID('4')
  interfaceLanguageId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  languageIds?: string[];
}
