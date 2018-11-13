"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function makeRouteInvoker(bottle, serviceName) {
    var invokers = new Map();
    // The service will be fetched only once the first route is actually called.
    // This is necessary to prevent services from being called before they have been wired up
    // or defined.
    /* tslint:disable-next-line:no-any */
    var service;
    if (!bottle.list().includes(serviceName)) {
        throw new Error("Cannot make routeInvoker for non-existent service '" + serviceName);
    }
    return function routeInvoker(methodName) {
        if (invokers.has(methodName)) {
            return invokers.get(methodName);
        }
        var routeInvoker = _asyncErrorWrapper(function routeInvoker(req, res, next) {
            if (!service) {
                service = bottle.container[serviceName];
                if (!service) {
                    throw new Error("Could not fetch service '" + serviceName + "' from container");
                }
            }
            if (typeof service[methodName] !== 'function') {
                throw new Error("Invoked method '" + methodName + "' not in route service '" + serviceName + ".");
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