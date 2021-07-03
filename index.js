'use strict';

const pkg = require("./package.json");
const OrientDB = require('orientjs');

exports.plugin = {
    pkg,
    register: async (server, options) => {

        // Default values
        const {
            host,
            port = 2424,
            httpPort = 2480,
            username,
            password,
            db,
            initOnRequestLifecycleStep = 'onRequest',
            forceCreateDB = true,
            sessionsOptions = {},
            connectOptions = {}
        } = options

        const client = new OrientDB.OrientDBClient({
            host,
            port,
            httpPort,
            username,
            password,
            ...connectOptions
        });

        await client.connect()

        const dbConfig = {
            name: db, 
            username: (
                typeof options.dbUsername !== 'undefined' && options.dbUsername !== undefined ? options.dbUsername : username
            ),
            password: (
                typeof options.dbPassword !== 'undefined' && options.dbPassword !== undefined ? options.dbPassword : password
            ),
        }

        const { pool } = await client.sessions({
            ...dbConfig,
            ...sessionsOptions
        })

        // Attach to server
        server.decorate('server', 'OrientDB', {
            client, 
            pool
        })

        // Init in lifecycle
        server.ext({
            type: initOnRequestLifecycleStep,
            method: async (request, h) => {

                // Get session from pool and pass to request
                request.app.OrientDB = await pool.acquire()

                // Log
                server.log([pkg.name, initOnRequestLifecycleStep], `Session acquired. ${pool.available} of ${pool.size} sessions still available.`)

                // On finish
                request.events.once('disconnect', async () => {

                    // Log
                    server.log([pkg.name, 'disconnect'], `Session closed. ${pool.borrowed} sessions still open.`)

                    if (typeof request.app.OrientDB !== 'undefined' && request.app.OrientDB !== undefined) {

                        // Release the session
                        await request.app.OrientDB.close()

                    }

                    // eslint-disable-next-line no-console
                    console.error('Request aborted')

                })

                return h.continue

            }

        })

        // After
        server.ext({
            type: 'onPreResponse',
            method: async (request, h) => {

                if (typeof request.app.OrientDB !== 'undefined' && request.app.OrientDB !== undefined) {

                    // Release the session
                    await request.app.OrientDB.close()

                }

                // Close the pool
                // TODO: await pool.close(); // https://github.com/orientechnologies/orientjs/issues/360

                // Log
                server.log([pkg.name, 'onPreResponse'], `Session closed. ${pool.borrowed} sessions still open.`)

                return h.continue

            }
        })

        process.on('SIGINT', async () => {

            // Close client
            await client.close()

        })

    }

}