# hapi-orientdb
[hapi](https://hapijs.com/) plugin for [OrientDB](https://orientdb.com/).

Inspired by code at [OrientJS Chat Example](https://github.com/orientechnologies/orientjs-example/tree/master/orientjs-chat-example-async-await).

## Usage
```
await server.register({
    plugin: require('hapi-orientdb'),
    options: {
        host: 'ip',
        port: 'port',
        db: 'db_name',
        username: 'username',
        password: 'password',
        // Optional :
        initOnRequestLifecycleStep: 'onRequest', // = Default value.
        forceCreateDB: true, // = Default value.
        sessionsOptions: { // = Default value.
            pool: {
                max: 25
            }
        },
        connectOptions: { // = Default value.
            pool: {
                max: 10
            }
        }
    }
});
```

## Dependencies

- [OrientJS driver](https://github.com/orientechnologies/orientjs)