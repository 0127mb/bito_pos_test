import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SearchProductsDto } from './dto/search-products.dto';
import { Product } from '../../shared/schema/product.schema';
import type { AuthUser } from '../../shared/types/auth-user.type';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<Product>,
  ) {}

  async search(user: AuthUser, query: SearchProductsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const search = query.search?.trim();

    const filter: {
      tenantId: Types.ObjectId;
      isActive: boolean;
      name?: { $regex: string; $options: string };
    } = {
      tenantId: new Types.ObjectId(user.tenantId),
      isActive: true,
    };

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const [products, total] = await Promise.all([
      this.productModel
        .find(filter)
        .select('_id name sku price stock')
        .sort({ name: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.productModel.countDocuments(filter),
    ]);

    return {
      items: products.map((product) => ({
        id: product._id.toString(),
        name: product.name,
        sku: product.sku,
        price: product.price,
        stock: product.stock,
      })),
      page,
      limit,
      total,
    };
  }
}
