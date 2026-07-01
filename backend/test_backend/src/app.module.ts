import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './features/auth/auth.module';
import { UsersModule } from './features/users/users.module';
import { TenantsModule } from './features/tenants/tenants.module';
import { ProductsModule } from './features/products/products.module';
import { OrdersModule } from './features/orders/orders.module';
import { ReportsModule } from './features/reports/reports.module';
import { WebhooksModule } from './features/webhooks/webhooks.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGODB_URI'),
      }),
    }),
    AuthModule,
    UsersModule,
    TenantsModule,
    ProductsModule,
    OrdersModule,
    ReportsModule,
    WebhooksModule,
  ],
})
export class AppModule {}
