import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateAccountDto } from './dto/update-account.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Prisma } from '../generated/prisma/client';

@Injectable()
export class AccountService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertAccountActive(accountId: string): Promise<void> {
    const account = await this.prisma.account.findUnique({
      where: { accountId },
      select: { status: true },
    });
    if (account?.status === 'suspended') {
      throw new ForbiddenException('Account is suspended');
    }
    if (account?.status === 'banned') {
      throw new ForbiddenException('Account has been banned');
    }
  }

  // GET /account/me
  async getMe(accountId: string) {
    const account = await this.prisma.account.findUnique({
      where: { accountId },
      select: {
        accountId: true,
        email: true,
        name: true,
        nickname: true,
        ageRange: true,
        gender: true,
        status: true,
        createdAt: true,
        interfaceLanguage: {
          select: { languageId: true, code: true, name: true },
        },
        accountLanguages: {
          select: {
            language: {
              select: { languageId: true, code: true, name: true },
            },
          },
        },
        accountRoles: {
          select: { role: { select: { name: true } } },
        },
      },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    return {
      accountId: account.accountId,
      email: account.email,
      name: account.name,
      nickname: account.nickname,
      ageRange: account.ageRange,
      gender: account.gender,
      status: account.status,
      createdAt: account.createdAt,
      interfaceLanguage: account.interfaceLanguage ?? null,
      languages: account.accountLanguages.map((al) => al.language),
      roles: account.accountRoles.map((ar) => ar.role.name),
    };
  }

  // PATCH /account/me
  async updateMe(accountId: string, dto: UpdateAccountDto) {
    await this.assertAccountActive(accountId);

    const existing = await this.prisma.account.findUnique({
      where: { accountId },
    });
    if (!existing) {
      throw new NotFoundException('Account not found');
    }

    if (dto.languageIds !== undefined) {
      const languageIds = dto.languageIds;
      try {
        await this.prisma.$transaction(async (tx) => {
          // Update scalar fields if provided
          if (dto.name !== undefined || dto.interfaceLanguageId !== undefined) {
            await tx.account.update({
              where: { accountId },
              data: {
                ...(dto.name !== undefined ? { name: dto.name } : {}),
                ...(dto.interfaceLanguageId !== undefined
                  ? { interfaceLanguageId: dto.interfaceLanguageId }
                  : {}),
              },
            });
          }
          // Replace spoken languages
          await tx.accountLanguage.deleteMany({ where: { accountId } });
          if (languageIds.length > 0) {
            await tx.accountLanguage.createMany({
              data: languageIds.map((languageId) => ({
                accountId,
                languageId,
              })),
            });
          }
        });
      } catch (e) {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === 'P2003'
        ) {
          throw new BadRequestException(
            'One or more language IDs or interfaceLanguageId are invalid',
          );
        }
        throw e;
      }
    } else if (
      dto.name !== undefined ||
      dto.interfaceLanguageId !== undefined
    ) {
      try {
        await this.prisma.account.update({
          where: { accountId },
          data: {
            ...(dto.name !== undefined ? { name: dto.name } : {}),
            ...(dto.interfaceLanguageId !== undefined
              ? { interfaceLanguageId: dto.interfaceLanguageId }
              : {}),
          },
        });
      } catch (e) {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === 'P2003'
        ) {
          throw new BadRequestException('interfaceLanguageId is invalid');
        }
        throw e;
      }
    }

    return this.getMe(accountId);
  }

  // PATCH /account/me/password
  async changePassword(accountId: string, dto: ChangePasswordDto) {
    const account = await this.prisma.account.findUnique({
      where: { accountId },
      select: { passwordHash: true, status: true },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }
    if (account.status === 'suspended') {
      throw new ForbiddenException('Account is suspended');
    }
    if (account.status === 'banned') {
      throw new ForbiddenException('Account has been banned');
    }
    if (!account.passwordHash) {
      throw new BadRequestException(
        'Account uses OAuth and does not have a password',
      );
    }

    const currentValid = await argon2.verify(
      account.passwordHash,
      dto.currentPassword,
    );
    if (!currentValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const newHash = await argon2.hash(dto.newPassword, {
      type: argon2.argon2id,
    });

    await this.prisma.account.update({
      where: { accountId },
      data: { passwordHash: newHash },
    });

    return { message: 'Password changed successfully' };
  }
}
