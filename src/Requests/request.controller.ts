import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { RequestService } from './request.service';
import { Request as RequestEntity } from './request.entity';
@Controller('api/request') // This matches your Postman URL: localhost:3000/api/request
export class RequestController {
  constructor(private readonly requestService: RequestService) {}

  @Get() // This handles: GET localhost:3000/api/request
  getAllRequests() {
    return this.requestService.findAll();
  }
  @Post()
  async createRequest(@Body() requestData: Partial<RequestEntity>) {
    //adding await and return ensures the full saved object is sent to postman
    const result = await this.requestService.create(requestData);
    return result;
  }
  @Patch(':id/status')
  async updateStatus(@Param('id') id: number, @Body('status') status: string) {
    const result = await this.requestService.updateStatus(id, status);
    return result;
  }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    await this.requestService.remove(id);
    return { message: `Request ${id} successfully delete ` }; // return a success message
  }
}
