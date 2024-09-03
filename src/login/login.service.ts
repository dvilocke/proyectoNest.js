import { CreateLoginDto } from './dto/create-login.dto';
import { UpdateLoginDto } from './dto/update-login.dto';
import { DatabaseService } from 'src/database/database.service';
import { Login } from './entities/login.entity';


import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';


@Injectable()
export class LoginService {

  constructor(
    private readonly dataBaseService: DatabaseService,
    private readonly jwtService: JwtService
  ){}

  public async createUser(createLoginDto: CreateLoginDto) {
    //cargamos sus propiedades
    const login = (new Login()).cargarPropiedades(createLoginDto);

    //Eliminamos sus propiedades que sean null
    login.eliminarPropiedadesNull();

    //debemos preguntarnos si ya existe ese usuario
    const resultado = await this.dataBaseService.select(login);

    if (resultado.length > 0 || await this.comprobarSiYaExisteEmail(login.correo)) {
      throw new HttpException('User already exists', HttpStatus.CONFLICT);
    }

    //tenemos que hacer otro filtro
    const resultadoBaseDatos = await this.dataBaseService.insert(login);

    const newModeloLogin = new Login()
    newModeloLogin.cargarPropiedades(resultadoBaseDatos[0]);    

    //debemos quitarle el id a ese objet
    if (newModeloLogin.hasOwnProperty('nameTable') && newModeloLogin.hasOwnProperty('id_usuario')) {
      delete newModeloLogin.nameTable;
      delete newModeloLogin.id_login;
    }
    return newModeloLogin;
  }

  public async hacerLogin(createLoginDto: CreateLoginDto) {
    const objetoLogin = (new Login()).cargarPropiedades(createLoginDto);
    objetoLogin.eliminarPropiedadesNull();

    let resultado = await this.dataBaseService.selectOne(objetoLogin);

    //significa que no tenemos un usuario
    if (resultado.length === 0) {
      throw new UnauthorizedException('incorrect credentials');
    }

    //Tenemos un usario, tenemos que generarle el jwt
    resultado = resultado[0];
    const payload = { usuario: resultado.usuario, id_login: resultado.id_login};

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  public async validarUsario(idUsuario:number) {
    //vamos hacer la validación del usuario
    const objetoLogin = new Login();

    objetoLogin.id_login = idUsuario;
    objetoLogin.eliminarPropiedadesNull();

    const resultado = await  this.dataBaseService.selectOne(objetoLogin);

    return resultado.length > 0;
  }

  private async comprobarSiYaExisteEmail(email: string) {
    let modeloConsulta = new Login();
    modeloConsulta.correo = email;

    modeloConsulta.eliminarPropiedadesNull();

    const resultado = await this.dataBaseService.select(modeloConsulta);
    if (resultado.length > 0) {
      return true;
    }
    return false;
  }

}
