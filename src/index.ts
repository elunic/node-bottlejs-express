import * as Bottle from 'bottlejs';
import {
  ErrorRequestHandler,
  NextFunction,
  Request,
  RequestHandler,
  Response,
} from 'express';

export function makeRouteInvoker(bottle: Bottle, classConstructor: new(...args: any[]) => any, ...injectedServiceNames: string[]): (method: string) => RequestHandler;
export function makeRouteInvoker(bottle: Bottle, serviceName: string): (method: string) => RequestHandler;
export function makeRouteInvoker(bottle: Bottle, classOrServicename: string | (new(...args: any[]) => any), ...injectedServiceNames: string[]): (method: string) => RequestHandler {
  const invokers = new Map();

  // The service will be fetched only once the first route is actually called.
  // This is necessary to prevent services from being called before they have been wired up
  // or defined.
  /* tslint:disable-next-line:no-any */
  let service: any;

  if (typeof classOrServicename === 'string') {
    if (!bottle.list().includes(classOrServicename)) {
      throw new Error(`Cannot make routeInvoker for non-existent service '${classOrServicename}`);
    }
  }

  return function routeInvoker(methodName: string) {
    if (invokers.has(methodName)) {
      return invokers.get(methodName);
    }

    const routeInvoker = _asyncErrorWrapper(function routeInvoker(req: Request, res: Response, next: NextFunction) {
      if (!service) {
        if (typeof classOrServicename === 'string') {
          service = bottle.container[classOrServicename];

          if (!service) {
            throw new Error(`Could not fetch service '${classOrServicename}' from container`);
          }
        } else {
          const injectedServices = injectedServiceNames.map(name => bottle.container[name]);
          service = new classOrServicename(...injectedServices);
        }
      }

      if (typeof service[methodName] !== 'function') {
        throw new Error(`Invoked method '${methodName}' not in route service '${classOrServicename}.`);
      }

      return service[methodName](req, res, next);
    });

    invokers.set(methodName, routeInvoker);

    return routeInvoker;
  };
}

export function makeMiddlewareInvoker(bottle: Bottle, middlewareFactory: Function): RequestHandler {
  let middleware: RequestHandler;

  const middlewareInvoker = _asyncErrorWrapper(function middlewareInvoker(req: Request, res: Response, next: NextFunction) {
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
  } as RequestHandler);

  return middlewareInvoker;
}

export function makeErrorMiddlewareInvoker(bottle: Bottle, middlewareFactory: Function): ErrorRequestHandler {
  let middleware: ErrorRequestHandler;

  const middlewareInvoker = _asyncErrorWrapper(function middlewareInvoker(err: Error, req: Request, res: Response, next: NextFunction) {
    if (!middleware) {
      middleware = middlewareFactory(bottle.container);
    }

    return middleware(err, req, res, next);
  } as ErrorRequestHandler);

  return middlewareInvoker;
}

function _asyncErrorWrapper(fn: RequestHandler): RequestHandler;
function _asyncErrorWrapper(fn: ErrorRequestHandler): ErrorRequestHandler;
function _asyncErrorWrapper(fn: Function): Function {
  if (fn.length === 4) {
    return function asyncErrorWrapper(err: Error, req: Request, res: Response, next: NextFunction) {
      const returnValue = fn(err, req, res, next);

      if (returnValue && returnValue.catch && typeof returnValue.catch === 'function') {
        returnValue.catch(next);
      }
    };
  } else {
    return function asyncErrorWrapper(req: Request, res: Response, next: NextFunction) {
      const returnValue = fn(req, res, next);

      if (returnValue && returnValue.catch && typeof returnValue.catch === 'function') {
        returnValue.catch(next);
      }
    };
  }
}
