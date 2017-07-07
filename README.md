# node-libstorj

Node.js bindings to libstorj https://github.com/Storj/libstorj

## Dependencies

Requires having `libstorj` installed on the system, please see details at https://github.com/Storj/libstorj for building and installing.

## Development

If you do not have `node-gyp` installed:

```
$ npm install -g node-gyp
```

To build:

```
$ npm install
$ node-gyp build
```

To test:

```
$ npm run test
```

