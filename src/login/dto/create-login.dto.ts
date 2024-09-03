import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class CreateLoginDto {

    @IsString()
    @MinLength(1)
    usuario: string;

    @IsString()
    @MinLength(6)
    clave: string;

    @IsString()
    @IsEmail()
    correo:string;
}
