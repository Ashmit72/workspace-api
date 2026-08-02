import { IsEmail, IsIn } from 'class-validator';

export class InviteMemberDto {
  @IsEmail()
  email!: string;

  @IsIn(['Admin', 'Member']) // deliberately excluding 'Owner' — you don't invite someone AS owner
  roleName!: string;
}