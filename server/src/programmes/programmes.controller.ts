import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import {
  ProgrammesService,
  FilterProgrammeParams,
  SaveToggleResponse,
} from './programmes.service';
import { CreateProgrammeDto } from './dto/create-programme.dto';
import { UpdateProgrammeDto } from './dto/update-programme.dto';

@Controller('programmes')
export class ProgrammesController {
  constructor(private readonly programmesService: ProgrammesService) {}

  /**
   * CREATE a new programme
   */
  @Post()
  async create(@Body() createProgrammeDto: CreateProgrammeDto) {
    return await this.programmesService.create(createProgrammeDto);
  }

  /**
   * GET all programmes with filtering and pagination
   * Includes support for keyword, location, skills, interests, and "saved" status.
   */
  @Get()
  async findAll(@Query() filterDto: FilterProgrammeParams) {
    return await this.programmesService.findAll(filterDto);
  }

  /**
   * TOGGLE SAVE STATUS
   * Triggered when the user clicks the star icon on the details page.
   * Expects { userId: string } in the body.
   */
  @Post(':id/save')
  async toggleSave(
    @Param('id') programmeId: string,
    @Body('userId') userId: string,
  ): Promise<SaveToggleResponse> {
    return await this.programmesService.toggleSave(programmeId, userId);
  }

  /**
   * CHECK SAVED STATUS
   * Used to determine if the star icon should be filled or outlined when the page loads.
   */
  @Get(':id/is-saved/:userId')
  async checkSavedStatus(
    @Param('id') programmeId: string,
    @Param('userId') userId: string,
  ): Promise<{ isSaved: boolean }> {
    const programme = await this.programmesService.findOne(programmeId);

    // Check if the volunteer with this userId is in the programme's saved_by list
    const isSaved = programme.saved_by?.some((v) => v.id === userId) || false;

    return { isSaved };
  }

  /**
   * GET a single programme by ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.programmesService.findOne(id);
  }

  /**
   * UPDATE an existing programme
   */
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateProgrammeDto) {
    return await this.programmesService.update(id, updateDto);
  }

  /**
   * DELETE a programme
   */
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.programmesService.remove(id);
  }

  @Get('recommendations/:userId')
  async getRecommendations(
    @Param('userId') userId: string,
    @Query() filterDto: FilterProgrammeParams,
  ) {
    // This calls your new "Veteran-First" logic
    return await this.programmesService.getRecommended(userId, filterDto);
  }
}
