import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApplicationsService,
  IncomingApplicationDto,
} from './applications.service';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('applications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  @Roles('admin', 'volunteer')
  // FIX: Configured diskStorage destination and filename generation to prevent file execution in memory
  @UseInterceptors(
    FileInterceptor('resume', {
      storage: diskStorage({
        destination: './uploads/resumes',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `resume-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async create(
    @Body() createApplicationDto: IncomingApplicationDto, // FIX: Swapped out 'any' for strict interface type safety
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return await this.applicationsService.create(createApplicationDto, file);
  }

  @Get('organization/:orgId')
  @Roles('admin', 'organization')
  async findByOrganization(@Param('orgId') orgId: string) {
    return await this.applicationsService.findAllByOrg(orgId);
  }

  @Get('check/:volunteerId/:programmeId')
  @Roles('admin', 'volunteer')
  async checkEnrollment(
    @Param('volunteerId') volunteerId: string,
    @Param('programmeId') programmeId: string,
  ) {
    return await this.applicationsService.checkStatus(volunteerId, programmeId);
  }

  @Patch(':id/status')
  @Roles('admin', 'organization')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: 'upcoming' | 'rejected' | 'approved',
  ) {
    // By explicitly typing the variable here, TS knows it's safe
    // for the service call without needing 'as'
    const finalStatus: 'upcoming' | 'rejected' =
      status === 'approved' ? 'upcoming' : status;

    return await this.applicationsService.updateStatus(id, finalStatus);
  }

  @Get()
  @Roles('admin')
  async findAll() {
    return await this.applicationsService.findAll();
  }

  @Get(':id')
  @Roles('admin', 'volunteer', 'organization')
  async findOne(@Param('id') id: string) {
    return await this.applicationsService.findOne(id);
  }

  @Delete(':id')
  @Roles('admin', 'volunteer')
  async remove(@Param('id') id: string) {
    return await this.applicationsService.remove(id);
  }
}
