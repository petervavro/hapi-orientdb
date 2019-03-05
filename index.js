'use strict';

const pkg = require("./package.json");
const OrientDBClient = require('orientjs').OrientDBClient;

exports.plugin = {
    pkg,
    register: async function (server, options) {

        // Default values
        let initOnRequestLifecycleStep = 'onRequest';

        if (typeof options.initOnRequestLifecycleStep !== 'undefiend' &&
            options.initOnRequestLifecycleStep !== undefined &&
            options.initOnRequestLifecycleStep !== '') {

            initOnRequestLifecycleStep = options.initOnRequestLifecycleStep;
        };

        const config = {
            host: options.host,
            port: options.port,
            db: options.db,
            user: options.username,
            password: options.password,
        };

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
            });

            let pool = await client.sessions({
                name: config.db,
                username: config.user,
                password: config.password,
                pool: {
                    max: 25
                }
            });

            return { client, pool };

        };

        const boostrap = ({ client, pool }) => {

            server.ext({
                type: initOnRequestLifecycleStep,
                method: async function (request, h) {

                    // Get session from pool and pass to request
                    request.app.OrientDB = await pool.acquire();

                    // Logging
                    server.log([pkg.name, initOnRequestLifecycleStep], `Session acquired.`);

                    // On finish
                    request.events.once('disconnect', async function () {

                        // Log
                        server.log([pkg.name, 'disconnect'], `Session closed. ${pool.pending()} sessions open.`);

                        if (typeof request.app.OrientDB !== 'undefined' && request.app.OrientDB !== undefined) {

                            // Release the session
                            await request.app.OrientDB.close();

                        }

                        console.error('request aborted');

                    })

                    return h.continue;

                }

            });

            server.ext({
                type: 'onPreResponse',
                method: async function (request, h) {

                    if (typeof request.app.OrientDB !== 'undefined' && request.app.OrientDB !== undefined) {

                        // Release the session
                        await request.app.OrientDB.close();

                    }

                    // Close the pool
                    // TODO :: await pool.close(); // https://github.com/orientechnologies/orientjs/issues/360

                    // Log
                    server.log([pkg.name, 'onPreResponse'], `Session closed. ${pool.pending()} sessions open.`);

                    return h.continue;
                }
            });

            process.on('SIGINT', async function (a, b) {

                // Close client
                await client.close();

            });

        }

        // Init process method
        const run = async () => {

            let { client, pool } = await setupDatabase();

            boostrap({ client, pool });

        };

        // Run
        run();
    }
};