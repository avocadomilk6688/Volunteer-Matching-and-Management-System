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
import { UpdateApplicationDto } from './dto/update-application.dto';

@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  // This interceptor allows NestJS to parse the FormData (text + file)
  @UseInterceptors(FileInterceptor('resume'))
  async create(
    @Body() createApplicationDto: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    // We pass both the text fields and the file to the service
    return await this.applicationsService.create(createApplicationDto, file);
  }

  // ADD THIS: This handles the GET request from your frontend's useEffect
  @Get('check/:volunteerId/:programmeId')
  async checkEnrollment(
    @Param('volunteerId') volunteerId: string,
    @Param('programmeId') programmeId: string,
  ) {
    return await this.applicationsService.checkStatus(volunteerId, programmeId);
  }

  @Get()
  async findAll() {
    return await this.applicationsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.applicationsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateApplicationDto: UpdateApplicationDto,
  ) {
    return await this.applicationsService.update(id, updateApplicationDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.applicationsService.remove(id);
  }
}
