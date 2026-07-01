import { UnauthorizedException } from '@nestjs/common';
import { LoginCommand } from './login.command';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tenant } from 'src/shared/schema/temant.schema';
import { User } from 'src/shared/schema/user.schema';
import * as argon2 from 'argon2';

@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand> {
  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    @InjectModel(Tenant.name)
    private readonly tenantModel: Model<Tenant>,
  ) {}

  async execute(command: LoginCommand) {
    const tenantSlug = command.dto.tenantSlug.trim().toLowerCase();
    const email = command.dto.email.trim().toLowerCase();
    const { password } = command.dto;
    const tenant = await this.tenantModel.findOne({ slug: tenantSlug });

    if (!tenant) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const user = await this.userModel
      .findOne({
      tenantId: tenant._id,
      email,
      })
      .select('+passwordHash');

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordOk = await argon2.verify(user.passwordHash, password);
    if (!passwordOk) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user._id.toString(),
      tenantId: user.tenantId.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);
    return {
      accessToken,
      user: {
        id: user._id.toString(),
        tenantId: user.tenantId.toString(),
        role: user.role,
        email: user.email,
        name: user.name,
      },
    };
  }
}
