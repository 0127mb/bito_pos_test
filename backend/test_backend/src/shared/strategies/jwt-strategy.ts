import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthUser } from '../types/auth-user.type';
import { Role } from '../enum/Role.enum';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  validate(payload:{
      sub: string;
      tenantId: string;
      role: Role;
      email: string;

  }): AuthUser {
  if (!payload) {
      throw new UnauthorizedException('Missing or invalid token');
    }
    return {
     sub:payload.sub,
     tenantId:payload.tenantId,
     role:payload.role,
     email:payload.email
    }
}}
