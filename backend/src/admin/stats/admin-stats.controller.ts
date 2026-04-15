import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Res,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery } from '@nestjs/swagger';
import type { Response } from 'express';
import { AdminStatsService } from './admin-stats.service';

@Controller('admin/stats')
export class AdminStatsController {
  constructor(private readonly adminStatsService: AdminStatsService) {}

  @Get()
  @ApiOperation({ summary: 'Full overview of all users, meetings, and scores' })
  @ApiOkResponse({ description: 'Stats list' })
  getStats() {
    return this.adminStatsService.getStats();
  }

  @Get('export')
  @ApiOperation({ summary: 'Download stats as CSV or XLSX' })
  @ApiQuery({ name: 'format', enum: ['csv', 'xlsx'], required: false })
  @ApiQuery({ name: 'critical_missing', required: false, type: Number })
  async export(
    @Res() res: Response,
    @Query('format') format: string = 'csv',
    @Query('critical_missing') criticalMissingRaw?: string,
  ) {
    const criticalMissing =
      criticalMissingRaw !== undefined
        ? parseInt(criticalMissingRaw, 10)
        : undefined;
    if (criticalMissing !== undefined && isNaN(criticalMissing)) {
      throw new BadRequestException('critical_missing must be a number');
    }

    const date = new Date().toLocaleDateString('de-DE').replace(/\./g, '-');

    if (format === 'xlsx') {
      const buffer = await this.adminStatsService.getXlsx(criticalMissing);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="kastenliste-oil-export-${date}.xlsx"`,
      );
      res.send(buffer);
    } else if (format === 'csv') {
      const csv = await this.adminStatsService.getCsv();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="kastenliste-oil-export-${date}.csv"`,
      );
      res.send(csv);
    } else {
      throw new BadRequestException('format must be csv or xlsx');
    }
  }
}
