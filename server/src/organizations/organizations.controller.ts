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
  UploadedFiles,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { OrganizationsService } from './organizations.service';
import {
  CreateOrganizationDto,
  CreateOrganizationRegistrationDto,
  UpdateOrganizationRegistrationDto,
} from './dto/create-organization.dto';

interface UpdateOrgPayload {
  username?: string;
  email?: string;
  password?: string;
  address?: string;
  description?: string;
  contact_number?: string;
  profile_picture_url?: string;
}

interface VerifyOrganizationBody {
  organizationName: string;
  authorizedPersonName: string;
  description: string;
  address: string;
}

const storageConfig = diskStorage({
  destination: './uploads/profiles',
  filename: (req, file, callback) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    callback(
      null,
      `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`,
    );
  },
});

const documentStorageConfig = diskStorage({
  destination: './uploads/documents',
  filename: (req, file, callback) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    callback(null, `DOC-${uniqueSuffix}${extname(file.originalname)}`);
  },
});

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post('verify')
  @UseInterceptors(
    FilesInterceptor('documents', 10, { storage: documentStorageConfig }),
  )
  async verifyOrganization(
    @Body() body: VerifyOrganizationBody,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const filePaths =
      files && files.length > 0
        ? files.map((f) => `/uploads/documents/${f.filename}`)
        : [];

    const registrationDto = {
      organizationName: body.organizationName,
      authorizedPersonName: body.authorizedPersonName,
      description: body.description,
      address: body.address,
      supporting_documents: filePaths,
    };

    return await this.organizationsService.createVerificationRegistration(
      registrationDto,
    );
  }

  // --- Registration Endpoints ---

  @Post('registration')
  async createRegistration(
    @Body() createRegDto: CreateOrganizationRegistrationDto,
  ) {
    return await this.organizationsService.createRegistration(createRegDto);
  }

  @Get('registration/pending')
  async findAllPendingRegistrations() {
    return await this.organizationsService.findAllPendingRegistrations();
  }

  @Get('registration')
  async findAllRegistrations() {
    return await this.organizationsService.findAllRegistrations();
  }

  @Get('registration/:id')
  async findOneRegistration(@Param('id') id: string) {
    return await this.organizationsService.findOneRegistration(id);
  }

  @Patch('registration/:id')
  async updateRegistration(
    @Param('id') id: string,
    // ─── FIXED: REPLACED ANY WITH STRICT TRANSITIONAL DTO CLASS ENFORCEMENT ───
    @Body() updateDto: UpdateOrganizationRegistrationDto,
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
    @Body() body: Record<string, unknown>,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const updateData: UpdateOrgPayload = {};

    if (typeof body.username === 'string') updateData.username = body.username;
    if (typeof body.email === 'string') updateData.email = body.email;
    if (typeof body.password === 'string') updateData.password = body.password;
    if (typeof body.address === 'string') updateData.address = body.address;
    if (typeof body.description === 'string')
      updateData.description = body.description;
    if (typeof body.contact_number === 'string')
      updateData.contact_number = body.contact_number;
    if (typeof body.profile_picture_url === 'string')
      updateData.profile_picture_url = body.profile_picture_url;

    if (file) {
      updateData.profile_picture_url = `/uploads/profiles/${file.filename}`;
    }

    return await this.organizationsService.update(id, updateData);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.organizationsService.remove(id);
  }
}
