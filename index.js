'use strict';

const pkg = require("./package.json");
const OrientDBClient = require('orientjs').OrientDBClient;

exports.plugin = {
    pkg,
    register: async function (server, options) {

        // Default values
        let initOnRequestLifecycleStep = 'onRequest'

        if (typeof options.initOnRequestLifecycleStep !== 'undefined' &&
            options.initOnRequestLifecycleStep !== undefined &&
            options.initOnRequestLifecycleStep !== '') {

            initOnRequestLifecycleStep = options.initOnRequestLifecycleStep

        }

        const forceCreateDB = (typeof options.forceCreateDB !== 'undefined' && options.forceCreateDB !== undefined ? options.forceCreateDB : true)

        /**
         * Init connection
         */
        const setupDatabase = async () => {

            let connectOptions = {
                pool: {
                    max: 10
                }
            }

            // Add options form outside
            if (typeof options.connectOptions !== 'undefined' && options.connectOptions !== undefined) {

                connectOptions = {
                    ...connectOptions,
                    ...options.connectOptions
                }

            }

            let client = await OrientDBClient.connect({
                host: options.host,
                port: options.port,
                ...connectOptions
            })

            const dbCredentials = {
                name: options.db,
                username: options.username,
                password: options.password
            }

            // Check if DB exists
            let doesDBExists = await client.existsDatabase(dbCredentials)

            if (forceCreateDB === true && doesDBExists === false) {

                // >>> Create DB

                const databaseOptions = { ...dbCredentials }

                // Storage
                if (typeof options.storage !== 'undefined' && options.storage !== undefined) databaseOptions.storage = options.storage

                // Type
                if (typeof options.type !== 'undefined' && options.type !== undefined) databaseOptions.type = options.type

                await client.createDatabase(databaseOptions)

                // <<< Create DB

            }

            let sessionsOptions = {
                pool: {
                    max: 25
                }
            }

            // Add options form outside
            if (typeof options.sessionsOptions !== 'undefined' && options.sessionsOptions !== undefined) {

                sessionsOptions = {
                    ...sessionsOptions,
                    ...options.sessionsOptions
                }

            }

            let pool = await client.sessions({
                ...dbCredentials,
                ...sessionsOptions
            })

            return { client, pool }

        }

        const boostrap = ({ client, pool }) => {

            // Attach to server
            server.decorate('server', 'OrientDB', {
                client, pool
            })

            // Init in lifecycle
            server.ext({
                type: initOnRequestLifecycleStep,
                method: async function (request, h) {

                    // Get session from pool and pass to request
                    request.app.OrientDB = await pool.acquire()

                    // Logging
                    server.log([pkg.name, initOnRequestLifecycleStep], `Session acquired.`)

                    // On finish
                    request.events.once('disconnect', async function () {

                        // Log
                        server.log([pkg.name, 'disconnect'], `Session closed. ${pool.pending()} sessions open.`)

                        if (typeof request.app.OrientDB !== 'undefined' && request.app.OrientDB !== undefined) {

                            // Release the session
                            await request.app.OrientDB.close()

                        }

                        // eslint-disable-next-line no-console
                        console.error('request aborted')

                    })

                    return h.continue

                }

            })

            // After
            server.ext({
                type: 'onPreResponse',
                method: async function (request, h) {

                    if (typeof request.app.OrientDB !== 'undefined' && request.app.OrientDB !== undefined) {

                        // Release the session
                        await request.app.OrientDB.close()

                    }

                    // Close the pool
                    // await pool.close(); // https://github.com/orientechnologies/orientjs/issues/360

                    // Log
                    server.log([pkg.name, 'onPreResponse'], `Session closed. ${pool.pending()} sessions open.`)

                    return h.continue

                }
            })

            process.on('SIGINT', async function (a, b) {

                // Close client
                await client.close()

            })

        }

        // Init process method
        const run = async () => {

            let { client, pool } = await setupDatabase()

            await boostrap({ client, pool })

        }

        // Run
        await run()

    }

}