import { Role } from '../enum/Role.enum';

export type AuthUser = {
  sub: string;
  tenantId: string;
  role: Role;
  email: string;
};
