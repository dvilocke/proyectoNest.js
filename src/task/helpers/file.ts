import { join } from 'path';
import { existsSync, renameSync, unlinkSync } from 'fs';

const cryptoAlgoritmo = require('crypto');

const EXTENSIONES_VALIDAS = [
    'png',
    'jpg',
    'jpeg',
    'gif'
]

const encriptar = (texto: string) => {
    if (texto) {
        return cryptoAlgoritmo.createHash('sha256').update(texto).digest('hex');
    }
}

const eliminarArchivo = (texto: string) => {
    try {
        for(const extension of EXTENSIONES_VALIDAS) {
            let hash = encriptar(texto) + `.${extension}`;
            let path = join(__dirname, '../../../', 'static/tasks', hash);
            if (existsSync(path)) {
                unlinkSync(path);
                break;
            }
        }
    } catch(error) {
        console.log('Sucedio un error interno eliminando la imagen');
    }
}
const comprobarSiExisteArchivo = (ruta:string) => {
    return existsSync(ruta);
}

const cambiarNombreArchivo = (textoViejo: string, textoNuevo: string) => {
    try {
        let extensionReal = '';

        for(const extension of EXTENSIONES_VALIDAS) {
            let hash = textoViejo + `.${extension}`;
            let path = join(__dirname, '../../../', 'static/tasks', hash);
            if (existsSync(path)) {
                extensionReal = extension;
                break;
            }
        }
        if (extensionReal) {
            textoViejo += `.${extensionReal}`;
            textoNuevo += `.${extensionReal}`;

            const oldPath = join(__dirname, '../../../', 'static/tasks', textoViejo);
            const newPath = join(__dirname, '../../../', 'static/tasks', textoNuevo);
            renameSync(oldPath, newPath);
            return textoNuevo;
        }

    } catch(error) {
        console.log('Sucedio un error interno renombrando el archivo');
    }
    
}

const concatenarArchivoRutaImagenes = (archivo: string) => {
    return join(__dirname, '../../../', 'static/tasks', archivo);
}

//funcion para filtrar los archivos que se están subiendo
//Permite definir reglas para aceptar o rechazar un archivo
const fileFilter = (req, file, cb) => {
    // si intercepto un archivo
    if (!file) {
        return cb(new Error('File es vacio'), false);
    }
    const extension = file. mimetype.split('/')[1];

    if (EXTENSIONES_VALIDAS.includes(extension)) {
        return cb(null, true)
    }
    return cb(null, false)
}


const fileName = (req, file, cb) => {
    if (!file) {
        return cb(new Error('File es vacio'), false)
    }
    const algoritmo = 'imagen_' + req.user.usuario + req.user.id_login;
    const extension = file. mimetype.split('/')[1];

    let resultado = encriptar(algoritmo)
    resultado += `.${extension}`;

    return cb(null, resultado);
}

module.exports = {
    fileFilter,
    fileName,
    eliminarArchivo,
    encriptar,
    cambiarNombreArchivo,
    concatenarArchivoRutaImagenes,
    comprobarSiExisteArchivo
}