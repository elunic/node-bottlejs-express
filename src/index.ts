import * as Bottle from 'bottlejs';
import * as Express from 'express';

export function makeRouteInvoker(bottle: Bottle, serviceName: string) {
  const invokers = new Map();

  // The service will be fetched only once the first route is actually called.
  // This is necessary to prevent services from being called before they have been wired up
  // or defined.
  /* tslint:disable-next-line:no-any */
  let service: any;

  if (!bottle.list().includes(serviceName)) {
    throw new Error(`Cannot make routeInvoker for non-existent service '${serviceName}`);
  }

  return function routeInvoker(methodName: string) {
    if (invokers.has(methodName)) {
      return invokers.get(methodName);
    }

    const routeInvoker = _asyncErrorWrapper(function routeInvoker(req, res, next) {
      if (!service) {
        service = bottle.container[serviceName];

        if (!service) {
          throw new Error(`Could not fetch service '${serviceName}' from container`);
        }
      }

      if (typeof service[methodName] !== 'function') {
        throw new Error(`Invoked method '${methodName}' not in route service '${serviceName}.`);
      }

      return service[methodName](req, res, next);
    });

    invokers.set(methodName, routeInvoker);

    return routeInvoker;
  };
}

export function makeMiddlewareInvoker(bottle: Bottle, middlewareFactory: Function) {
  let middleware: Express.RequestHandler;

  const middlewareInvoker = _asyncErrorWrapper(function middlewareInvoker(req, res, next) {
    if (!middleware) {
      try {
        middleware = middlewareFactory(bottle.container);
      } catch (ex) {
        ex.message = `Could not fetch middleware from middlewareFactory: ${ex.message}`;
        throw ex;
      }


      if (!middleware) {
        throw new Error(`Could not fetch middleware from middlewareFactory`);
      }
    }

    return middleware(req, res, next);
  } as Express.RequestHandler);

  return middlewareInvoker;
}

export function makeErrorMiddlewareInvoker(bottle: Bottle, middlewareFactory: Function) {
  let middleware: Express.ErrorRequestHandler;

  const middlewareInvoker = _asyncErrorWrapper(function middlewareInvoker(err, req, res, next) {
    if (!middleware) {
      middleware = middlewareFactory(bottle.container);
    }

    return middleware(err, req, res, next);
  } as Express.ErrorRequestHandler);

  return middlewareInvoker;
}

function _asyncErrorWrapper(fn: Express.RequestHandler): Express.RequestHandler;
function _asyncErrorWrapper(fn: Express.ErrorRequestHandler): Express.ErrorRequestHandler;
function _asyncErrorWrapper(fn: Function): Function {
  if (fn.length === 4) {
    return function asyncErrorWrapper(err: Error, req: Express.Request, res: Express.Response, next: Function) {
      const returnValue = fn(err, req, res, next);

      if (returnValue && returnValue.catch && typeof returnValue.catch === 'function') {
        returnValue.catch(next);
      }
    };
  } else {
    return function asyncErrorWrapper(req: Express.Request, res: Express.Response, next: Function) {
      const returnValue = fn(req, res, next);

      if (returnValue && returnValue.catch && typeof returnValue.catch === 'function') {
        returnValue.catch(next);
      }
    };
  }
}
