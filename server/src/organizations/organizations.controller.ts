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
import { diskStorage } from 'multer';
import { extname } from 'path';
import { OrganizationsService } from './organizations.service';
import {
  CreateOrganizationDto,
  CreateOrganizationRegistrationDto,
} from './dto/create-organization.dto';

// --- Interfaces for Type Safety ---
interface UpdateOrgPayload {
  username?: string;
  email?: string;
  password?: string;
  address?: string;
  description?: string;
  contact_number?: string;
  profile_picture_url?: string;
}

interface UpdateRegistrationPayload extends Partial<CreateOrganizationRegistrationDto> {
  address?: string;
}

// --- Multer Configuration Helper ---
const storageConfig = diskStorage({
  destination: './uploads/profiles', // Ensure this folder exists in your project root
  filename: (req, file, callback) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    callback(
      null,
      `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`,
    );
  },
});

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  // --- Registration Endpoints ---

  @Post('registration')
  async createRegistration(
    @Body() createRegDto: CreateOrganizationRegistrationDto,
  ) {
    return await this.organizationsService.createRegistration(createRegDto);
  }

  @Get('registration')
  async findAllRegistrations() {
    return await this.organizationsService.findAllRegistrations();
  }

  @Patch('registration/:id')
  async updateRegistration(
    @Param('id') id: string,
    @Body() updateDto: UpdateRegistrationPayload,
  ) {
    return await this.organizationsService.updateRegistration(id, updateDto);
  }

  @Delete('registration/:id')
  async removeRegistration(@Param('id') id: string) {
    return await this.organizationsService.removeRegistration(id);
  }

  // --- Organization Profile Endpoints ---

  @Post()
  @UseInterceptors(
    FileInterceptor('profile_picture', { storage: storageConfig }),
  )
  async create(
    @Body() createDto: CreateOrganizationDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const data: CreateOrganizationDto & { profile_picture_url?: string } = {
      ...createDto,
    };

    if (file) {
      // Now 'file.filename' exists because we used diskStorage
      data.profile_picture_url = `/uploads/profiles/${file.filename}`;
    }

    return await this.organizationsService.create(data);
  }

  @Get()
  async findAll() {
    return await this.organizationsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.organizationsService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(
    FileInterceptor('profile_picture', { storage: storageConfig }),
  )
  async update(
    @Param('id') id: string,
    @Body() body: UpdateOrgPayload,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const updateData: UpdateOrgPayload = { ...body };

    if (file) {
      // file.filename will be something like "profile_picture-17156...jpg"
      updateData.profile_picture_url = `/uploads/profiles/${file.filename}`;
    }

    return await this.organizationsService.update(id, updateData);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.organizationsService.remove(id);
  }
}
