import { Controller, Post, Delete, Get, Param, UseGuards } from '@nestjs/common';
import { ClassResourceService } from './class-resource.service';
import { JwtAuthGuard } from 'src/Auth/jwt-auth-guard';

@Controller('classes')
@UseGuards(JwtAuthGuard)
export class ClassResourceController {
  constructor(private readonly service: ClassResourceService) {}

  // Assign a resource to a class
  @Post(':classId/resources/:resourceId')
  assign(
    @Param('classId')    classId:    string,
    @Param('resourceId') resourceId: string,
  ) {
    return this.service.assign(classId, resourceId);
  }

  // Remove a resource from a class
  @Delete(':classId/resources/:resourceId')
  remove(
    @Param('classId')    classId:    string,
    @Param('resourceId') resourceId: string,
  ) {
    return this.service.remove(classId, resourceId);
  }

  // Get all resources assigned to a class
  @Get(':classId/resources')
  getResources(@Param('classId') classId: string) {
    return this.service.getResourcesForClass(classId);
  }
}