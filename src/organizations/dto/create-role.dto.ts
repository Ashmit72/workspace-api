import { ArrayNotEmpty, IsArray, IsNotEmpty, IsString, IsUUID, MaxLength, MinLength } from "class-validator";

export class CreateRoleDto{
    @IsString()
    @IsNotEmpty()
    @MinLength(2)
    @MaxLength(50)
    name!:string

    @IsArray()
    @ArrayNotEmpty()
    @IsUUID('4',{each:true})
    permissionIds!:string[]

}