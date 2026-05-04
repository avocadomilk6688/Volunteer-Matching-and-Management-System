import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { VolunteersService } from './volunteers.service';
import { Volunteer } from './entities/volunteer.entity';

@Controller('volunteers')
export class VolunteersController {
  constructor(private readonly volunteersService: VolunteersService) {}

  // --- STATIC ROUTES (Must remain at the top) ---
  @Get('leaderboard')
  async getLeaderboard(): Promise<Volunteer[]> {
    return await this.volunteersService.getLeaderboard();
  }

  @Get('skills')
  findAllSkills() {
    return this.volunteersService.findAllSkills();
  }

  @Get('interests')
  findAllInterests() {
    return this.volunteersService.findAllInterests();
  }

  @Post('skills')
  createSkill(@Body('name') name: string) {
    return this.volunteersService.createSkill(name);
  }

  @Post('interests')
  createInterest(@Body('name') name: string) {
    return this.volunteersService.createInterest(name);
  }

  // --- DYNAMIC ROUTES ---
  @Get(':id/history')
  async getHistory(@Param('id') id: string) {
    const historyData = await this.volunteersService.getHistory(id);
    if (!historyData) {
      return {
        message: 'Volunteer history not found',
        history: [],
        totalHours: 0,
        rating: 0,
      };
    }
    return historyData;
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.volunteersService.findOne(id);
  }

  @Get()
  findAll() {
    return this.volunteersService.findAll();
  }

  /**
   * UPDATED PATCH ROUTE
   * Includes storage configuration to persist files to the disk.
   */
  @Patch(':id')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'profile_picture', maxCount: 1 },
        { name: 'resume', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          // 1. Define folder destination based on the field name
          destination: (req, file, cb) => {
            const uploadPath =
              file.fieldname === 'profile_picture'
                ? './uploads/avatars'
                : './uploads/resumes';
            cb(null, uploadPath);
          },
          // 2. Create a unique filename to prevent overwriting
          filename: (req, file, cb) => {
            const uniqueSuffix =
              Date.now() + '-' + Math.round(Math.random() * 1e9);
            const ext = extname(file.originalname);
            cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
          },
        }),
        // 3. Optional: File Filter for security
        fileFilter: (req, file, cb) => {
          if (
            file.fieldname === 'resume' &&
            file.mimetype !== 'application/pdf'
          ) {
            return cb(new Error('Only PDFs are allowed for resumes!'), false);
          }
          cb(null, true);
        },
      },
    ),
  )
  update(
    @Param('id') id: string,
    @Body() updateDto: any,
    @UploadedFiles()
    files: {
      profile_picture?: Express.Multer.File[];
      resume?: Express.Multer.File[];
    },
  ) {
    return this.volunteersService.update(id, updateDto, files);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.volunteersService.remove(id);
  }
}
