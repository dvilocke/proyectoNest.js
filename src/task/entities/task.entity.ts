import { Model } from "src/common/model/model";

export class Task extends Model {

    public nameTable = 'task';
    public id_task:number = null;
    public id_login:number = null;
    public nombre_tarea:string = null;
    public fecha_creacion:string = null;
    public fecha_finalizacion:string = null;
    public estado:number = null;
    public imagen:string = null;
}
