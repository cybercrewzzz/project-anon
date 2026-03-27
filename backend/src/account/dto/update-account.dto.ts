/**
 * UpdateAccountDto
 * Defines the request body for the PATCH /account/me endpoint.
 * All fields are optional — only provided fields will be updated.
 */

import { IsOptional, IsString, IsArray, ArrayUnique } from 'class-validator';

export class UpdateAccountDto {
  /**
   * Optional display name for the user's profile.
   */
  @IsOptional()
  @IsString()
  name?: string;

  /**
   * Optional ID of the language used for the app interface.
   */
  @IsOptional()
  @IsString()
  interfaceLanguageId?: string;

  /**
   * Optional list of language IDs representing the user's spoken languages.
   * Replaces all existing spoken languages when provided.
   */
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  languageIds?: string[];
}
