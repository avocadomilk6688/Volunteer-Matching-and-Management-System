import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as fs from 'fs';
import { AppModule } from './app.module';

async function bootstrap() {
  // 1. Create the app with the Express engine type
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 2. Automatically create upload directories if they don't exist
  // This prevents the "ENOENT: no such file or directory" error
  const uploadDirs = ['./uploads/avatars', './uploads/resumes'];
  uploadDirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      // recursive: true ensures the parent 'uploads' folder is created first
      fs.mkdirSync(dir, { recursive: true });
      console.log(`[Storage] Created directory: ${dir}`);
    }
  });

  // 3. Serve the 'uploads' folder as static assets
  // This allows the frontend to access images via http://localhost:3000/uploads/...
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // 4. Standard configurations
  app.enableCors();

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`
🚀 Server is running on: http://localhost:${port}
📂 Static assets served at: http://localhost:${port}/uploads/
  `);
}

bootstrap();
