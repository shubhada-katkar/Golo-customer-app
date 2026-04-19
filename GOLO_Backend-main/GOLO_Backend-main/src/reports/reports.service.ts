import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Report, ReportDocument } from './schemas/report.schema';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Report.name) private reportModel: Model<ReportDocument>,
  ) {}

  async createReport(createReportDto: {
    type: string;
    targetId: string;
    reporterId?: string;
    reason: string;
    details?: string;
  }): Promise<Report> {
    const createdReport = new this.reportModel(createReportDto);
    return createdReport.save();
  }

  async findAllReports(query: any): Promise<Report[]> {
    const filter: any = {};
    if (query.type) filter.type = query.type;
    if (query.status) filter.status = query.status;
    if (query.targetId) filter.targetId = query.targetId;

    return this.reportModel.find(filter).sort({ createdAt: -1 }).exec();
  }
}
