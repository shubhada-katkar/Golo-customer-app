import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  async create(
    @Body()
    createReportDto: {
      type: string;
      targetId: string;
      reporterId?: string;
      reason: string;
      details?: string;
    },
  ) {
    const report = await this.reportsService.createReport(createReportDto);
    return { success: true, data: report };
  }

  @Get()
  async findAll(@Query() query: any) {
    const reports = await this.reportsService.findAllReports(query);
    return { success: true, data: reports };
  }
}
