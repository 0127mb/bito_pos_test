import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { SalesReportCacheService } from '../../shared/cache/sales-report-cache.service';
import { Order, OrderStatus } from '../../shared/schema/order.schema';
import type { AuthUser } from '../../shared/types/auth-user.type';
import { SalesReportQueryDto } from './dto/sales-report-query.dto';

type SalesReport = {
  topProducts: Array<{
    productId: string;
    name: string;
    sku: string;
    quantity: number;
    revenue: number;
    margin: number;
  }>;
  totalRevenue: number;
  totalMargin: number;
};

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<Order>,
    private readonly cache: SalesReportCacheService,
  ) {}

  async sales(user: AuthUser, query: SalesReportQueryDto): Promise<SalesReport> {
    const tenantId = new Types.ObjectId(user.tenantId);
    const from = query.from ? new Date(query.from) : new Date(0);
    const to = query.to ? new Date(query.to) : new Date();
    const cacheKey = `${user.tenantId}:${from.toISOString()}:${to.toISOString()}`;
    const cached = this.cache.get<SalesReport>(cacheKey);

    if (cached) {
      return cached;
    }

    const pipeline: PipelineStage[] = [
      {
        $match: {
          tenantId,
          status: OrderStatus.PAID,
          paidAt: { $gte: from, $lte: to },
        },
      },
      { $unwind: '$items' },
      {
        $facet: {
          topProducts: [
            {
              $group: {
                _id: '$items.productId',
                name: { $first: '$items.name' },
                sku: { $first: '$items.sku' },
                quantity: { $sum: '$items.quantity' },
                revenue: { $sum: '$items.lineTotal' },
                margin: {
                  $sum: {
                    $multiply: [
                      { $subtract: ['$items.unitPrice', '$items.unitCost'] },
                      '$items.quantity',
                    ],
                  },
                },
              },
            },
            { $sort: { quantity: -1, revenue: -1 } },
            { $limit: 5 },
            {
              $project: {
                _id: 0,
                productId: { $toString: '$_id' },
                name: 1,
                sku: 1,
                quantity: 1,
                revenue: 1,
                margin: 1,
              },
            },
          ],
          totals: [
            {
              $group: {
                _id: null,
                totalRevenue: { $sum: '$items.lineTotal' },
                totalMargin: {
                  $sum: {
                    $multiply: [
                      { $subtract: ['$items.unitPrice', '$items.unitCost'] },
                      '$items.quantity',
                    ],
                  },
                },
              },
            },
            { $project: { _id: 0, totalRevenue: 1, totalMargin: 1 } },
          ],
        },
      },
    ];

    const [result] = await this.orderModel.aggregate<{
      topProducts: SalesReport['topProducts'];
      totals: Array<{ totalRevenue: number; totalMargin: number }>;
    }>(pipeline);

    const report = {
      topProducts: result?.topProducts ?? [],
      totalRevenue: result?.totals[0]?.totalRevenue ?? 0,
      totalMargin: result?.totals[0]?.totalMargin ?? 0,
    };

    this.cache.set(cacheKey, report);
    return report;
  }
}
