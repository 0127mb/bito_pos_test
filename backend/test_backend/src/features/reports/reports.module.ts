import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SalesReportCacheService } from '../../shared/cache/sales-report-cache.service';
import { Order, OrderSchema } from '../../shared/schema/order.schema';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService, SalesReportCacheService],
})
export class ReportsModule {}
