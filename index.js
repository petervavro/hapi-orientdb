'use strict';

const pkg = require("./package.json")
const OrientDBClient = require('orientjs').OrientDBClient

exports.plugin = {
    pkg,
    register: async function (server, options) {

        const config = {
            host: options.host,
            port: options.port,
            db: options.db,
            user: options.username,
            password: options.password
        }

        /**
         * Init connection
         */
        const setupDatabase = async () => {

            let client = await OrientDBClient.connect({
                host: config.host,
                port: config.port,
                pool: {
                    max: 10
                }
            })

            let pool = await client.sessions({
                name: config.db,
                username: config.user,
                password: config.password,
                pool: {
                    max: 25
                }
            })

            return { client, pool }

        }

        const boostrap = ({ client, pool }) => {

            server.ext({
                type: 'onRequest',
                method: async function (request, h) {

                    // Get session from pool
                    let session = await pool.acquire()

                    // Logging
                    server.log([pkg.name], 'Session acquired.');

                    // Pass to request
                    request.app.OrientDB = session

                    // On finish
                    request.events.once('finish', async function (a) {

                        // Release the session
                        await session.close()

                        // Close the pool
                        // TODO :: await pool.close(); // https://github.com/orientechnologies/orientjs/issues/360

                        // Log
                        server.log([pkg.name], 'Session closed.');

                    })

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

            boostrap({ client, pool })

        }

        // Run
        run()
    }
};