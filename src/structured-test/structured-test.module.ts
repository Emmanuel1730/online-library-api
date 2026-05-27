import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StructuredTest, TestSubmission } from './structured-test.entity';
import { StructuredTestService } from './structured-test.service';
import { StructuredTestController } from './structured-test.controller';

@Module({
  imports: [TypeOrmModule.forFeature([StructuredTest, TestSubmission])],
  controllers: [StructuredTestController],
  providers: [StructuredTestService],
  exports: [StructuredTestService],
})
export class StructuredTestModule {}