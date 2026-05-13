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
    // Relative path for database consistency and browser security
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
  async findAll(@Query() filterDto: FilterProgrammeParams) {
    return await this.programmesService.findAll(filterDto);
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
    const programme = await this.programmesService.findOne(programmeId);
    const isSaved = programme.saved_by?.some((v) => v.id === userId) || false;
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
