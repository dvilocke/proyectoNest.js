const {fileFilter, fileName} = require('./helpers/file');

import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from 'src/login/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';

import { Controller, Post, Body, UseGuards, Request, Get, Param, Query, Delete, HttpCode, HttpStatus, Patch, UseInterceptors, Res } from '@nestjs/common';
import { diskStorage } from 'multer';
import { Response } from 'express';

@Controller('task')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  //Enpoint para crear una tarea y subir una imagen
  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FileInterceptor('file', {
    fileFilter: fileFilter,
    storage: diskStorage({
      destination: './static/tasks',
      filename: fileName
    })
  }))
  create(@Body() createTaskDto: CreateTaskDto, @Request() req: any) {
    return this.taskService.create(createTaskDto, req.user.id_login, req.user.usuario, req);
  }

  //Enpoint para mostrar una imagen
  @UseGuards(JwtAuthGuard)
  @Get('imagen/:id')
  public async obtenerImagenPorIdImagen(@Param('id') idImagen: string, @Request() req: any, @Res() res: Response) {
    const ruta = await this.taskService.obtenerImagenPorId(idImagen,req.user.usuario, req.user.id_login);
    return res.sendFile(ruta);
  }

  //Enpoint para obtener una tarea con un id
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  obtenerTareaPorId(@Param('id') id: number, @Request() req) {
    return this.taskService.obtenerTareaPorId(id, req.user.id_login);
  }

  //Endpoint para obtener todas las tareas
  @UseGuards(JwtAuthGuard)
  @Get()
  obtenerTodasLasTareas(
    @Query('limit')  limit: number,
    @Query('offset') offset: number, 
    @Request() req
  ) {
    return this.taskService.obtenerTodasLasTareas(limit, offset, req.user.id_login);
  }

  //Endpoint para eliminar una tarea
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminarTareaPorId(@Param('id') id: number, @Request() req) {
    return this.taskService.eliminarTareaPorId(id, req.user.id_login);
  }


  //Endpoint para editar una tarea en especifica
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  editarTareaPorId(@Param('id') id: number, @Body() updateTaskDto: UpdateTaskDto, @Request() req) {
    return this.taskService.editarTareaPorId(id, updateTaskDto, req.user.id_login);
  }
}
