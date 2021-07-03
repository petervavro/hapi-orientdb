# hapi-orientdb
[hapi](https://hapijs.com/) plugin to use [OrientDB](https://orientdb.com/).

Inspired by code at [OrientJS Chat Example](https://github.com/orientechnologies/orientjs-example/tree/master/orientjs-chat-example-async-await).

## Usage
```
await server.register({
    plugin: require('hapi-orientdb'),
    options: {
        host: '0.0.0.0',
        username: 'YOUR_USERNAME_TO_ORIENTDB_SERVER',
        password: 'YOUR_PASSWORD_TO_ORIENTDB_SERVER',
        db: 'db_name',
        // Optional:
        dbUsername: 'YOUR_USERNAME_TO_ORIENTDB_DB',
        dbPassword: 'YOUR_USERNAME_TO_ORIENTDB_DB',
        port: 2424,
        httpPort: 2480,
        initOnRequestLifecycleStep: 'onRequest', // = Default value.
        forceCreateDB: true, // = Default value.
        sessionsOptions: {},
        connectOptions: {}
    }
});
```

## Dependencies

- [OrientJS driver](https://github.com/orientechnologies/orientjs)