
const {eliminarArchivo, cambiarNombreArchivo, encriptar, concatenarArchivoRutaImagenes, comprobarSiExisteArchivo} = require('./helpers/file');

import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { DatabaseService } from 'src/database/database.service';
import { Task } from './entities/task.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TaskService {

  private estados:{ [key:string] : number } = {
    estado_no_terminado : 0,
    estado_terminado: 1,
  };

  constructor(
    private readonly dataBaseService: DatabaseService,
    private readonly configService: ConfigService
  ){}

  public async create(createTaskDto: CreateTaskDto, idUser: number, usuario: string, req) {

    //creamos el modelo
    const modelo = (new Task()).cargarPropiedades(createTaskDto);
    modelo.id_login = idUser;
    modelo.estado = this.estados.estado_no_terminado;
    modelo.fecha_creacion = this.generarFechaFormateada();

    //Eliminamos las propiedades null
    modelo.eliminarPropiedadesNull();

    //debo preguntarme si ya existe esa tarea
    let modeloConsulta = new Task();
    modeloConsulta.nombre_tarea = modelo.nombre_tarea;
    modeloConsulta.eliminarPropiedadesNull();

    modeloConsulta = await this.dataBaseService.selectOne(modeloConsulta);

    if (modeloConsulta[0]) {

      //como el recurso ya existe, debemos eliminar la imagen
      if (req.file) {
        eliminarArchivo('imagen_' + usuario + idUser);
      }

      throw new ConflictException('El recurso ya existe'); 
    }

    let resultado = await this.dataBaseService.insert(modelo);

    if (resultado.length > 0) {
        resultado = (new Task()).cargarPropiedades(resultado[0]);
        if (req.file) {
          const textoViejo = encriptar('imagen_' + usuario + idUser);
          const textoNuevo = encriptar('imagen_' + usuario + idUser + resultado.id_task);
          const newArchivo = cambiarNombreArchivo(textoViejo, textoNuevo);
          if (newArchivo) {
            const modeloSet = new Task();
            modeloSet.imagen = newArchivo;
            modeloSet.eliminarPropiedadesNull();

            const modeloWhere = new Task();
            modeloWhere.id_task = resultado.id_task;
            modeloWhere.eliminarPropiedadesNull();

            let resultadoConsulta = (await this.dataBaseService.update(modeloSet, modeloWhere))[0];
            resultadoConsulta = (new Task()).cargarPropiedades(resultadoConsulta);
            
            resultado = resultadoConsulta;
          }
        }
        return this.formatearRespuesta(resultado);
    }
    throw new BadRequestException('sucedio un error creando la tarea')
  }

  //Funcion para obtener una tarea por id
  public async obtenerTareaPorId(id: number, idLogin: number) {
    const modeloConsulta = new Task();
    modeloConsulta.id_task = id;
    modeloConsulta.eliminarPropiedadesNull();

    let resultado = await this.dataBaseService.selectOne(modeloConsulta);

    if (!resultado[0]) {
      throw new NotFoundException(`registro con id ${id} no encontrado`);
    }

    if(resultado[0].id_login !== idLogin) {
      throw new UnauthorizedException(`registro con id ${id} no le pertenece`);
    }

    resultado = (new Task()).cargarPropiedades(resultado[0]);
    return this.formatearRespuesta(resultado);
  }

  //Funcion para eliminar una tarea por idobtenerTareaPorId
  public async eliminarTareaPorId(id: number, idLogin: number) {
    const modelo = new Task();
    modelo.id_task = id;
    modelo.eliminarPropiedadesNull();

    let resultado = await this.dataBaseService.selectOne(modelo);

    //debemos preguntarno si existe
    if (!resultado[0]) {
      throw new NotFoundException(`registro con id ${id} no encontrado`);
    }
    
    //Debemos preguntarnos si la tarea corresponde a dicho login
    if (resultado[0].id_login !== idLogin) {
      throw new UnauthorizedException(`registro con id ${id} no le pertenece`);
    }
    await this.dataBaseService.delete(modelo);
  }

  //Funcion para obtener todas las tareas
  public async obtenerTodasLasTareas(limit: number, offset: number, id: number) {
    
    if (!limit) {
      limit = 10;
    }

    if (!offset) {
      offset = 0;
    }

    const modeloConsulta = new Task();
    modeloConsulta.id_login = id;
    modeloConsulta.eliminarPropiedadesNull();

    let resultado = await this.dataBaseService.select(modeloConsulta, limit, offset);

    resultado = resultado.map((elemento) => {
      return this.formatearRespuesta(elemento);
    });
    return resultado;
  }

  //funcion para editar una tarea
  public async editarTareaPorId(idTask:number, updateTaskDto: UpdateTaskDto, idLogin: number) {
    const modelo = new Task();
    modelo.id_login = idLogin;
    modelo.id_task = idTask;
    modelo.eliminarPropiedadesNull();
    
    let resultado =  (await this.dataBaseService.selectOne(modelo))[0];
    if (!resultado) {
      throw new NotFoundException(`registro con id ${idTask} no encontrado`);
    }
    
    const modeloWhere = new Task();
    modeloWhere.id_login = resultado.id_login;
    modeloWhere.id_task = resultado.id_task;
    modeloWhere.eliminarPropiedadesNull();

    const modeloSet = (new Task()).cargarPropiedades(updateTaskDto);
    modeloSet.eliminarPropiedadesNull();

    return this.formatearRespuesta((await this.dataBaseService.update(modeloSet, modeloWhere))[0]);

  }

  public async obtenerImagenPorId(idImagen: string, usuario: string, idLogin: number) {
    //Debemos preguntarnos si esa imagen le corresponde
    const modelo = new Task();
    modelo.id_login = idLogin;
    //comprobar si esa imagen le corresponde al cliente
    const resultado = await this.dataBaseService.ejecutarSql('selSiExisteImagen', [
      {
        "USUARIO"  : usuario,
        "ID_LOGIN" : modelo.id_login,
        "IMAGEN" : idImagen
      }
    ]);
    if (resultado.length > 0) {
      const path = concatenarArchivoRutaImagenes(resultado[0].imagen);
      if (!comprobarSiExisteArchivo(path)) {
        throw new BadRequestException(`Error, no se ha cargado la imagen`);
      }
      return path;
    }
    throw new BadRequestException(`Error, la imagen no le corresponde`);
  }

  //Funciones generales del servicio
  public formatearRespuesta(modelo) {
    delete modelo.nameTable;
    delete modelo.id_task;
    delete modelo.id_login;
    modelo.fecha_creacion = this.formatearFecha(modelo.fecha_creacion);

    if (modelo.imagen) {
      modelo.imagen = this.fomartearImagen(modelo.imagen);
    }

    return modelo;
  }

  public fomartearImagen(imagen: string) {
    return this.configService.get('HOST') + `/${imagen}`;
  }

  public formatearFecha(fecha: string) {
    const date = new Date(fecha);
    const dia = String(date.getDate()).padStart(2,'0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const ano = date.getFullYear();
    return `${ano}-${mes}-${dia}`;
  }

  public generarFechaFormateada(fecha = new Date()) {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

}
