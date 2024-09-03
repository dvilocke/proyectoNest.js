import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { join } from "path";
import { Client, ClientConfig } from 'pg';
const fs = require('fs');

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
    private client: Client
    private logger: Logger = new Logger('DatabaseService');
    private fs = require('fs');

    async onModuleInit() {
        const config: ClientConfig = {
            user: process.env.DB_USER,
            host: process.env.DB_HOST,
            database: process.env.DB_NAME,
            password: process.env.DB_PASSWORD,
            port: parseInt(process.env.DB_PORT, 10),
        }
        this.client = new Client(config);
        await this.client.connect();
        this.logger.log('connnected to the database');
    }

    async select(modelo, limit = 999999, offset = 0) {
        try {
            if (this.client && modelo.nameTable) {
                let consulta = `SELECT * from ${modelo.nameTable} WHERE `;
                let contador = 1;
                let valores = [];
                for(const nombre of Object.keys(modelo)) {
                    if (nombre !== 'nameTable') {
                        consulta += `${nombre}=$${contador}`;
                        //debo preguntarme si tengo otro mas
                        if (contador + 1 < Object.keys(modelo).length) {
                            consulta += ' AND ';
                        }
                         valores.push(modelo[nombre]);
                        contador++;
                    }
                }
                consulta += ` OFFSET ${offset} LIMIT ${limit}`;
                const resultado = await this.client.query(consulta, valores);
                return resultado.rows;
            }
        } catch(error) {
            this.logger.log('Sucedio un error' + error);
            return [];
        }
    }

    async selectOne(modelo) {
        return await this.select(modelo, 1);
    }

     async insert(modelo) {
        try {
            if (this.client && modelo.nameTable) {
                let primerArgumento = '('
                let segundoArgumento = '('
                let contador = 1;
                let valores = [];
                for(const nombre of Object.keys(modelo)) {
                    if (nombre !== 'nameTable') {
                        primerArgumento += nombre
                        segundoArgumento += `$${contador}`;
                        if (contador + 1 < Object.keys(modelo).length) {
                            primerArgumento += ', ';
                            segundoArgumento += ', ';
                        }
                        valores.push(modelo[nombre]);
                        contador++;
                    }
                }
                primerArgumento += ')'
                segundoArgumento += ')';
                if (primerArgumento && segundoArgumento) {
                    let consulta = `INSERT INTO ${modelo.nameTable} ${primerArgumento} VALUES ${segundoArgumento} RETURNING *`;
                    const resultado = await this.client.query(consulta, valores);
                    return resultado.rows;
                }
            }
        } catch(error) {
            this.logger.log('Sucedio un error' + error);
            return [];
        }
    }

    async delete(modelo) {
        try {
            if(this.client && modelo.nameTable) {
                let argumentos = '';
                let contador = 1;
                let valores = [];
                for(const nombre of Object.keys(modelo)) {
                    if (nombre !== 'nameTable') {
                        argumentos += nombre + `=$${contador}`;
                        if (contador + 1 < Object.keys(modelo).length) {
                            argumentos += ' AND ';
                        }
                        contador++;
                        valores.push(modelo[nombre])
                    }
                }
                let consulta = `delete from ${modelo.nameTable} where ${argumentos} RETURNING *`;
                const resultado = await this.client.query(consulta, valores);
                return resultado.rows;
            }
        } catch(error) {
            this.logger.log('Sucedio un error' + error);
            return [];
        }
    }

    async update(modeloSet, modeloWhere) {
        try {
            if(this.client && modeloSet.nameTable && modeloWhere.nameTable) {
                let argumentosSet = '';
                let contador = 1;
                for(const nombre of Object.keys(modeloSet)) {
                    if (nombre !== 'nameTable') {
                        argumentosSet += nombre + ` = '${modeloSet[nombre]}'`;
                        if (contador + 1 < Object.keys(modeloSet).length) {
                            argumentosSet += ' , ';
                        }
                        contador++;
                    }
                }

                let argumentosWhere = '';
                contador = 1;
                for(const nombre of Object.keys(modeloWhere)) {
                    if (nombre !== 'nameTable') {
                        argumentosWhere += nombre + ` = ${modeloWhere[nombre]}`;
                        if (contador + 1 < Object.keys(modeloWhere).length) {
                            argumentosWhere += ' AND ';
                        }
                        contador++;
                    }
                }
                const consulta = `UPDATE ${modeloSet.nameTable} SET ${argumentosSet} WHERE ${argumentosWhere} RETURNING *`;
                const resultado = await this.client.query(consulta);
                return resultado.rows;
            }
        } catch(error) {
            this.logger.log('Sucedio un error' + error);
            return [];
        }
    }

    //funcion para ejecutar una sql y pasarle los parametros
    public async ejecutarSql(nombreSql: string, parametros = []) {
        try {
            let rutaArchivosDb = join(__dirname, '../../src/database/sql');
           if (this.fs.existsSync(rutaArchivosDb)) {

                if (!nombreSql.includes('.json')) {
                    nombreSql += '.json';
                }
                rutaArchivosDb += join(`/${nombreSql}`);
                const contenido = this.fs.readFileSync(rutaArchivosDb, 'utf-8');
                const datos = JSON.parse(contenido);

                if (!this.existeLasLlaves(datos)) {
                    return;
                }
                const contarCuantasVecesSaleUnCaracter = (cadena: string, caracter: string) => {
                    let contador = 0;
                    for(let i = 0; i < cadena.length; i++) {
                        if (cadena[i] === caracter) {
                            contador++;
                        }
                    }
                    return contador;
                }
                const cantidadCaracteresPreguntas = contarCuantasVecesSaleUnCaracter(datos['consulta'], '?');
                if (cantidadCaracteresPreguntas !== datos['parametros'].length) {
                    throw new Error(`Error: se esperan ${cantidadCaracteresPreguntas} parametros`);
                }

                let consultaDefinitiva = datos['consulta'];
                if ( parametros) {
                    const keysParametros = Object.keys(parametros[0]);
                    let contador = 0;
                    
                    for(const parametro of datos['parametros']) {
                        if (!keysParametros.includes(Object.keys(parametro)[0])) {
                            throw new Error(`Error: Parametro no incluido:${Object.keys(parametro)[0]}`);
                        }
                    }
                    for(const elemento of datos['parametros']) {
                        let caracter;
                        if (elemento[keysParametros[contador]] === 'VARCHAR') {
                            caracter = `'${parametros[0][keysParametros[contador]]}'`;
                        } else {
                            caracter = parametros[0][keysParametros[contador]];
                        }
                        consultaDefinitiva = consultaDefinitiva.replace('?', caracter);
                        contador++;
                    }
                }
                const resultado = await this.client.query(consultaDefinitiva);
                return resultado.rows;
            }
        } catch (error) {
            this.logger.log(error);
        }
    }

    private existeLasLlaves(datos): boolean {
        const llavesPermitidas = [
            "consulta",
            "parametros"
        ];
        const keys = Object.keys(datos);
        const diferencia = llavesPermitidas.filter((elemento:string) => {
            return !keys.includes(elemento)
        })
        return diferencia.length === 0 && keys.length === llavesPermitidas.length;
    }
    async onModuleDestroy() {
        await this.client.end();
    }
}