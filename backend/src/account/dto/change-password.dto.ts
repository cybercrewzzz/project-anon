/**
 * ChangePasswordDto
 * Defines the request body for the PATCH /account/me/password endpoint.
 * Used to validate that the user provides both their current and new password.
 */

import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  /**
   * The user's current password.
   * Required to verify identity before allowing a password change.
   */
  @IsString()
  currentPassword: string;

  /**
   * The new password the user wants to set.
   * Must be at least 8 characters long for basic security.
   */
  @IsString()
  @MinLength(8)
  newPassword: string;
}