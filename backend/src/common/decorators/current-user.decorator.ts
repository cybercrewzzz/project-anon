import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface ValidatedUser {
  accountId: string;
  roles: string[];
}

export const CurrentUser = createParamDecorator(
  (
    data: keyof ValidatedUser | undefined,
    ctx: ExecutionContext,
  ): ValidatedUser | string | string[] => {
    const request = ctx.switchToHttp().getRequest<{ user: ValidatedUser }>();
    const user = request.user;
    return data ? user[data] : user;
  },
);
