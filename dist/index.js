"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _Map = require('es6-map');
function makeRouteInvoker(bottle, classOrServicename) {
    var injectedServiceNames = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        injectedServiceNames[_i - 2] = arguments[_i];
    }
    var invokers = new _Map();
    // The service will be fetched only once the first route is actually called.
    // This is necessary to prevent services from being called before they have been wired up
    // or defined.
    /* tslint:disable-next-line:no-any */
    var service;
    if (typeof classOrServicename === 'string') {
        if (!bottle.list().includes(classOrServicename)) {
            throw new Error("Cannot make routeInvoker for non-existent service '" + classOrServicename);
        }
    }
    return function routeInvoker(methodName) {
        if (invokers.has(methodName)) {
            return invokers.get(methodName);
        }
        var routeInvoker = _asyncErrorWrapper(function routeInvoker(req, res, next) {
            if (!service) {
                if (typeof classOrServicename === 'string') {
                    service = bottle.container[classOrServicename];
                    if (!service) {
                        throw new Error("Could not fetch service '" + classOrServicename + "' from container");
                    }
                }
                else {
                    var injectedServices = injectedServiceNames.map(function (name) { return bottle.container[name]; });
                    service = new (classOrServicename.bind.apply(classOrServicename, [void 0].concat(injectedServices)))();
                }
            }
            if (typeof service[methodName] !== 'function') {
                throw new Error("Invoked method '" + methodName + "' not in route service '" + classOrServicename + ".");
            }
            return service[methodName](req, res, next);
        });
        invokers.set(methodName, routeInvoker);
        return routeInvoker;
    };
}
exports.makeRouteInvoker = makeRouteInvoker;
function makeMiddlewareInvoker(bottle, middlewareFactory) {
    var middleware;
    var middlewareInvoker = _asyncErrorWrapper(function middlewareInvoker(req, res, next) {
        if (!middleware) {
            try {
                middleware = middlewareFactory(bottle.container);
            }
            catch (ex) {
                ex.message = "Could not fetch middleware from middlewareFactory: " + ex.message;
                throw ex;
            }
            if (!middleware) {
                throw new Error("Could not fetch middleware from middlewareFactory");
            }
        }
        return middleware(req, res, next);
    });
    return middlewareInvoker;
}
exports.makeMiddlewareInvoker = makeMiddlewareInvoker;
function makeErrorMiddlewareInvoker(bottle, middlewareFactory) {
    var middleware;
    var middlewareInvoker = _asyncErrorWrapper(function middlewareInvoker(err, req, res, next) {
        if (!middleware) {
            middleware = middlewareFactory(bottle.container);
        }
        return middleware(err, req, res, next);
    });
    return middlewareInvoker;
}
exports.makeErrorMiddlewareInvoker = makeErrorMiddlewareInvoker;
function _asyncErrorWrapper(fn) {
    if (fn.length === 4) {
        return function asyncErrorWrapper(err, req, res, next) {
            var returnValue = fn(err, req, res, next);
            if (returnValue && returnValue.catch && typeof returnValue.catch === 'function') {
                returnValue.catch(next);
            }
        };
    }
    else {
        return function asyncErrorWrapper(req, res, next) {
            var returnValue = fn(req, res, next);
            if (returnValue && returnValue.catch && typeof returnValue.catch === 'function') {
                returnValue.catch(next);
            }
        };
    }
}
//# sourceMappingURL=index.js.map