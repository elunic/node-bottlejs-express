# bottlejs-express

Provides functions to help with the integration of Express routes/middlewares and bottlejs services.

Useful if you want to integrate the powers of Inversion of Control/Dependency Injection and Express.

Inspired in part by [`awilix-express`](https://github.com/talyssonoc/awilix-express).

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
  * [Wrapping routes](#wrapping-routes)
  * [Wrapping middlewares](#wrapping-error-middlewares)
  * [Wrapping error middlewares](#wrapping-middlewares)
- [License](#license)


## Installation

```bash
$ npm install bottlejs-express
```


## Usage


#### Wrapping routes
```js
const {makeRouteInvoker} = require('bottlejs-express');

module.exports = ({bottle, expressApp}) => {
    bottle.factory('PostsRouter', PostsRouter);
    const routeInvoker = makeRouteInvoker(bottle, 'PostsRouter');

    expressApp.get('/posts/:postId', routeInvoker('getById'));
    expressApp.post('/posts', routeInvoker('create'));
};

function PostsRouter({dbService}) {
    const service = {
        getById,
        create,
    };

    ////

    async function getById(req, res, next) {
        const {postId} = req.params;
        
        try {
            await post = await dbService.query('SELECT ... WHERE ID ...');
            
            res.status(200).send({
                data: post,
            });
        } catch (ex) {
            res.status(500).send(`An error occured: ${ex.toString()}`);
        }
    }

    async function create(req, res, next) {
        const {data} = req.body;
        
        try {
            await dbService.query('INSERT INTO ...');
            
            res.status(201).send('OK');
        } catch (ex) {
            res.status(500).send(`An error occured: ${ex.toString()}`);
        }
    }

    ////

    return service;
}
```


#### Wrapping middlewares
```js
const {makeMiddlewareInvoker} = require('bottlejs-express');


module.exports = function ({expressApp, bottle}) {
    expressApp.use(makeMiddlewareInvoker(bottle, AuthorizationMiddlewareFactory));
};

function AuthorizationMiddlewareFactory({authService}) {
    return async function AuthorizationMiddleware (req, res, next) {
        try {
            const token = req.header('X-Api-Token');

            if (!authService.verify(token)) {
                return next();
            }

            req.auth.user = await authService.getUsername(token);

            next();
        } catch (ex) {
            console.error('Failed to authenticate request: ', ex);
            next();
        }
    }
}
```


#### Wrapping error middlewares
```js
const {makeErrorMiddlewareInvoker} = require('bottlejs-express');


module.exports = function ({expressApp, bottle}) {
    expressApp.use(makeErrorMiddlewareInvoker(bottle, ErrorHandlerMiddlewareFactory));
};

function ErrorHandlerMiddlewareFactory({loggingService}) {
    return async function ErrorHandlerMiddleware (err, req, res, next) {
        loggingService.logError(err);
        
        res.status(500).send('An error occured: ' + err.toString());
    }
}
```



## License

(The MIT License)

Copyright (c) 2018 elunic &lt;wh@elunic.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.