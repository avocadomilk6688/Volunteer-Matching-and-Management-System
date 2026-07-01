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
  Query,
  UseGuards,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { VolunteersService, UpdateProfileDto } from './volunteers.service';
import { Volunteer } from './entities/volunteer.entity';
import { VolunteerMonthlyPoint } from './entities/volunteer-monthly-point.entity';
import { Skill } from './entities/skill.entity';
import { Interest } from './entities/interest.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('volunteers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VolunteersController {
  constructor(private readonly volunteersService: VolunteersService) {}

  // --- 1. STATIC & RANKING ROUTES (Keep above dynamic :id) ---

  @Get('leaderboard')
  @Roles('admin', 'volunteer', 'organization')
  async getMonthlyLeaderboard(
    @Query('month') month?: string,
    @Query('year') year?: string,
  ): Promise<VolunteerMonthlyPoint[]> {
    const m = month ? parseInt(month, 10) : new Date().getMonth() + 1;
    const y = year ? parseInt(year, 10) : new Date().getFullYear();
    return await this.volunteersService.getLeaderboard(m, y);
  }

  @Get('skills')
  @Roles('admin', 'volunteer', 'organization')
  async findAllSkills(): Promise<Skill[]> {
    return await this.volunteersService.findAllSkills();
  }

  @Get('interests')
  @Roles('admin', 'volunteer', 'organization')
  async findAllInterests(): Promise<Interest[]> {
    return await this.volunteersService.findAllInterests();
  }

  @Post('skills')
  @Roles('admin')
  async createSkill(@Body('name') name: string): Promise<Skill> {
    return await this.volunteersService.createSkill(name);
  }

  @Post('interests')
  @Roles('admin')
  async createInterest(@Body('name') name: string): Promise<Interest> {
    return await this.volunteersService.createInterest(name);
  }

  // --- 2. PROGRAMME SPECIFIC OVERRIDES ---

  /**
   * FETCH VOLUNTEERS BY PROGRAMME ID
   * 🌟 Added explicitly to match frontend lookup payloads and power search matrix filtering.
   * Placed above dynamic ':id' wildcard to prevent NestJS route collision issues.
   */
  @Get('programme/:programmeId')
  @Roles('admin', 'volunteer', 'organization')
  async findVolunteersByProgramme(
    @Param('programmeId') programmeId: string,
  ): Promise<Volunteer[]> {
    return await this.volunteersService.findVolunteersByProgramme(programmeId);
  }

  // --- 3. DYNAMIC ROUTES ---

  @Get(':id/history')
  @Roles('admin', 'volunteer', 'organization')
  async getHistory(@Param('id') id: string): Promise<any> {
    const historyData = await this.volunteersService.getHistory(id);
    return (
      historyData || {
        message: 'Not found',
        history: [],
        totalHours: 0,
        rating: 0,
      }
    );
  }

  @Get(':id')
  @Roles('admin', 'volunteer', 'organization')
  async findOne(@Param('id') id: string): Promise<Volunteer | null> {
    return await this.volunteersService.findOne(id);
  }

  @Get()
  @Roles('admin')
  async findAll(): Promise<Volunteer[]> {
    return await this.volunteersService.findAll();
  }

  /**
   * UPDATE PROFILE
   * Fixed "any" error by using UpdateProfileDto and explicit Promise return.
   */
  @Patch(':id')
  @Roles('admin', 'volunteer')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'profile_picture', maxCount: 1 },
        { name: 'resume', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: (req, file, cb) => {
            const path =
              file.fieldname === 'profile_picture'
                ? './uploads/avatars'
                : './uploads/resumes';
            cb(null, path);
          },
          filename: (req, file, cb) => {
            const uniqueSuffix =
              Date.now() + '-' + Math.round(Math.random() * 1e9);
            cb(
              null,
              `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`,
            );
          },
        }),
      },
    ),
  )
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateProfileDto, // Typed DTO
    @UploadedFiles()
    files: {
      profile_picture?: Express.Multer.File[];
      resume?: Express.Multer.File[];
    },
  ): Promise<Volunteer | null> {
    return await this.volunteersService.update(id, updateDto, files);
  }

  @Delete(':id')
  @Roles('admin')
  async remove(@Param('id') id: string): Promise<{ deleted: boolean }> {
    return await this.volunteersService.remove(id);
  }
}
