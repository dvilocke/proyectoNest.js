import { Controller, Post, Body, Request, UseGuards} from '@nestjs/common';

import { LoginService } from './login.service';
import { JwtAuthGuard } from './jwt-auth.guard'

import { CreateLoginDto } from './dto/create-login.dto';


@Controller('auth')
export class LoginController {
  constructor(private readonly loginService: LoginService) {}

  @Post('register')
  createUser(@Body() createLoginDto: CreateLoginDto) {
    return this.loginService.createUser(createLoginDto);
  }  

  @Post('login')
  login(@Body() createLoginDto: CreateLoginDto) {
    return this.loginService.hacerLogin(createLoginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('protected')
  vistaProtegida(@Request() req) {
    return 'hola tengo mi ruta protegida';
  }
}
