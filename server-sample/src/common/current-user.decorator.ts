import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// 从 req.user 取当前登录用户（由 JwtAuthGuard 注入）
export const CurrentUser = createParamDecorator(
  (data: 'id' | undefined, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user;
    return data ? user?.[data] : user;
  },
);