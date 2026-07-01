import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../shared/guards/jwt.auth.guard';
import type { AuthUser } from '../../shared/types/auth-user.type';
import { SearchProductsDto } from './dto/search-products.dto';
import { ProductsService } from './products.service';

@ApiTags('products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  search(@CurrentUser() user: AuthUser, @Query() query: SearchProductsDto) {
    return this.productsService.search(user, query);
  }
}
