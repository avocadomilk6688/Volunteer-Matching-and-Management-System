import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

// Import the separated services to track down relationship profiles safely
import { OrganizationsService } from '../organizations/organizations.service';
import { VolunteersService } from '../volunteers/volunteers.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly orgService: OrganizationsService,
    private readonly volunteersService: VolunteersService,
  ) {}

  @Post('volunteer')
  async createVolunteer(@Body() createUserDto: CreateUserDto) {
    return await this.usersService.createVolunteer(createUserDto);
  }

  @Get('volunteer')
  async findAllVolunteers() {
    return await this.usersService.findAll();
  }

  @Get()
  async findAll() {
    return await this.usersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.usersService.findOne(id);
  }

  /**
   * Upgraded cascading user delete route.
   * Clears child-relation rows from separated profile tables before executing core table cleanups.
   */
  @Delete(':id')
  async remove(@Param('id') id: string) {
    // 1. Fetch the user details to ascertain the context role mapping constraint
    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }

    // 2. Safely call the correct feature service mapping parameters conditionally
    if (user.role === 'organization') {
      // Look up if an organization profile row matches this user row sequence
      const organizations = await this.orgService.findAll();
      const associatedOrg = organizations.find(
        (org) => org.user?.id === user.id,
      );

      if (associatedOrg) {
        await this.orgService.remove(associatedOrg.id);
      }
    } else if (user.role === 'volunteer') {
      // Look up if a volunteer profile row matches this user row sequence
      const volunteers = await this.volunteersService.findAll();
      const associatedVolunteer = volunteers.find(
        (vol) => vol.id === user.id || vol.id === user.id,
      ); // Matches your PRI structure

      if (associatedVolunteer) {
        await this.volunteersService.remove(associatedVolunteer.id);
      }
    }

    // 3. Clear the parent account row safely out of the primary registry database table
    return await this.usersService.remove(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateDto: any) {
    return await this.usersService.update(id, updateDto);
  }
}
