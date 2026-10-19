import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 全局前缀 /api，便于客户端统一和小程序白名单配置
  app.setGlobalPrefix('api');

  // 全局 DTO 校验管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // CORS（H5 原型调试用；小程序不受 CORS 限制）
  app.enableCors({ origin: true, credentials: true });

  await app.listen(process.env.PORT ?? 3000);
  console.log('Server running on http://localhost:3000/api');
}
bootstrap();