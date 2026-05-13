import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as fs from 'fs';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 1. Create the necessary directories
  // Added './uploads/programmes' to match your data
  const uploadDirs = [
    './uploads/avatars',
    './uploads/resumes',
    './uploads/programmes',
  ];

  uploadDirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`[Storage] Created directory: ${dir}`);
    }
  });

  // 2. Serve the 'uploads' folder for Avatars and Resumes (prefix: /uploads/)
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // This maps http://localhost:3000/images/programmes/pic.jpg -> ./uploads/programmes/pic.jpg
  app.useStaticAssets(join(__dirname, '..', 'uploads/programmes'), {
    prefix: '/images/programmes/',
  });

  app.enableCors();

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`
🚀 Server is running on: http://localhost:${port}
📂 Programme images served at: http://localhost:${port}/images/programmes/
📂 User assets served at: http://localhost:${port}/uploads/
  `);
}

bootstrap();
