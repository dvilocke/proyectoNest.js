export class Model {

    public cargarPropiedades<T>(dto: T) {
        for(let clave in dto) {
            if(this.hasOwnProperty(clave)) {
                (this as any)[clave] = dto[clave];
            }
        }
        return this;
    }

    public eliminarPropiedadesNull() {
        for(const clave in this) {
            if(this.hasOwnProperty(clave) && this[clave] === null) {
                delete this[clave];
            }  
        }
        return this;
    }

}