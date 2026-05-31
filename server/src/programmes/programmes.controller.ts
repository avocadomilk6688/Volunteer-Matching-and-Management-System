import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ProgrammesService,
  FilterProgrammeParams,
  SaveToggleResponse,
} from './programmes.service';
import { CreateProgrammeDto } from './dto/create-programme.dto';
import { UpdateProgrammeDto } from './dto/update-programme.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

// ─── EXPLICIT LINT-SAFE INTERFACES ───
interface SkillEntity {
  id: string;
  skill_name: string;
}
interface InterestEntity {
  id: string;
  interest_name: string;
}

interface VolunteerRelation {
  id: string;
}

interface ProgrammeEntityWithSavedBy {
  id: string;
  saved_by?: VolunteerRelation[];
}

interface ProgrammeResponseDto {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  organization?: { id: string };
  related_skills: SkillEntity[];
  related_interests: InterestEntity[];
  schedule: {
    mode: string;
    location: string;
    start_time: string;
    end_time: string;
  };
}

interface WrappedBackendResponse {
  items: ProgrammeResponseDto[];
  total: number;
}

@Controller('programmes')
export class ProgrammesController {
  constructor(private readonly programmesService: ProgrammesService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/programmes',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async create(
    @Body() createProgrammeDto: CreateProgrammeDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const imageUrl = file
      ? `/images/programmes/${file.filename}`
      : '/images/programmes/default.jpg';

    return await this.programmesService.create(createProgrammeDto, imageUrl);
  }

  @Patch(':id')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/programmes',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateProgrammeDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    let finalImageUrl = updateDto.imageUrl;

    if (file) {
      finalImageUrl = `/images/programmes/${file.filename}`;
    }

    return await this.programmesService.update(id, {
      ...updateDto,
      imageUrl: finalImageUrl,
    });
  }

  @Get()
  async findAll(
    @Query() filterDto: FilterProgrammeParams,
  ): Promise<WrappedBackendResponse> {
    let rawResult: unknown;

    // Evaluate query parameters accurately
    const hasFilters =
      filterDto.page ||
      filterDto.keyword ||
      filterDto.location ||
      filterDto.skill ||
      filterDto.interest;

    if (!hasFilters) {
      rawResult = await this.programmesService.findAllAdmin();
    } else {
      rawResult = await this.programmesService.findAll(filterDto);
    }

    // ─── TYPE-SAFE MATRIX RE-CONSTRUCTION ───
    if (Array.isArray(rawResult)) {
      return {
        items: rawResult as ProgrammeResponseDto[],
        total: rawResult.length,
      };
    }

    if (rawResult && typeof rawResult === 'object' && 'items' in rawResult) {
      const castedResult = rawResult as WrappedBackendResponse;
      return {
        items: castedResult.items || [], // 👈 Cleaned up! No redundant type assertion here anymore.
        total: typeof castedResult.total === 'number' ? castedResult.total : 0,
      };
    }

    return {
      items: [],
      total: 0,
    };
  }

  @Post(':id/save')
  async toggleSave(
    @Param('id') programmeId: string,
    @Body('userId') userId: string,
  ): Promise<SaveToggleResponse> {
    return await this.programmesService.toggleSave(programmeId, userId);
  }

  @Get(':id/is-saved/:userId')
  async checkSavedStatus(
    @Param('id') programmeId: string,
    @Param('userId') userId: string,
  ): Promise<{ isSaved: boolean }> {
    const programme = (await this.programmesService.findOne(
      programmeId,
    )) as unknown as ProgrammeEntityWithSavedBy;
    const savedByArray = programme.saved_by;

    const isSaved = Array.isArray(savedByArray)
      ? savedByArray.some((v: VolunteerRelation) => v.id === userId)
      : false;

    return { isSaved };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.programmesService.findOne(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.programmesService.remove(id);
  }

  @Get('recommendations/:userId')
  async getRecommendations(
    @Param('userId') userId: string,
    @Query() filterDto: FilterProgrammeParams,
  ) {
    return await this.programmesService.getRecommended(userId, filterDto);
  }
}
