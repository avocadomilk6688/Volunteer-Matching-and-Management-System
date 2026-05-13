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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApplicationsService } from './applications.service';

@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('resume'))
  async create(
    @Body() createApplicationDto: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return await this.applicationsService.create(createApplicationDto, file);
  }

  // FIXED: Frontend was getting 404 because this was missing
  @Get('organization/:orgId')
  async findByOrganization(@Param('orgId') orgId: string) {
    return await this.applicationsService.findAllByOrg(orgId);
  }

  @Get('check/:volunteerId/:programmeId')
  async checkEnrollment(
    @Param('volunteerId') volunteerId: string,
    @Param('programmeId') programmeId: string,
  ) {
    return await this.applicationsService.checkStatus(volunteerId, programmeId);
  }

  // ADDED: Endpoint for approving/rejecting applications
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: 'approved' | 'rejected',
  ) {
    return await this.applicationsService.updateStatus(id, status);
  }

  @Get()
  async findAll() {
    return await this.applicationsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.applicationsService.findOne(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.applicationsService.remove(id);
  }
}
