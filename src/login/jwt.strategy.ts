import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from 'passport-jwt';
import { LoginService } from "./login.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly loginService: LoginService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: 'mi_secreto_jwt',
        })
    }

    async validate(payload: any) {
        const resultado = await this.loginService.validarUsario(payload.id_login);
        if (!resultado) {
            throw new UnauthorizedException('incorrect credentials')
        }
        return payload;
    }
}