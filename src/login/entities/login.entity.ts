import { Model } from "src/common/model/model";

export class Login extends Model {

    public nameTable = 'login';

    public id_login:number = null;
    public usuario:string = null;
    public clave:string = null;
    public correo:string = null;

}
