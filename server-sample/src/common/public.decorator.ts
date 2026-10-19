import { SetMetadata } from '@nestjs/common';

// 标记路由为公开（无需 JWT），用于 /api/auth/login 等
export const IS_PUBLIC_KEY = 'is_public';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);