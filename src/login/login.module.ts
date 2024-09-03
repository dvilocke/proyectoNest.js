import { Module } from '@nestjs/common';
import { LoginService } from './login.service';
import { LoginController } from './login.controller';
import { DatabaseModule } from 'src/database/database.module';

import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';

@Module({
  controllers: [LoginController],
  providers: [LoginService, JwtStrategy],
  imports: [
    DatabaseModule,
    PassportModule,
    JwtModule.register({
      secret: 'mi_secreto_jwt',
      signOptions: {expiresIn: '1h'}
    })
  ]
})
export class LoginModule {}
