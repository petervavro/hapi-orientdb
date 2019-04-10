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
        // optional : initOnRequestLifecycleStep: 'onRequest' // = Default value.
    }
});
```

## Dependencies

- [OrientJS driver](https://github.com/orientechnologies/orientjs)