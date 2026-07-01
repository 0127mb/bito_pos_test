import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthController } from './controller/auth.controller';
import { LoginHandler } from './command/login/login.handler';
import { Tenant, TenantSchema } from '../../shared/schema/temant.schema';
import { User, UserSchema } from '../../shared/schema/user.schema';
import { JwtStrategy } from '../../shared/strategies/jwt-strategy';

@Module({
  imports: [
    CqrsModule,
    MongooseModule.forFeature([
      { name: Tenant.name, schema: TenantSchema },
      { name: User.name, schema: UserSchema },
    ]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [LoginHandler, JwtStrategy],
})
export class AuthModule {}
