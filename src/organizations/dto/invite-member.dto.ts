import { IsEmail, IsIn, IsNotEmpty, IsString } from 'class-validator';

export class InviteMemberDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  roleName!: string;
}