import * as Bottle from 'bottlejs';
import { ErrorRequestHandler, RequestHandler } from 'express';
export declare function makeRouteInvoker(bottle: Bottle, classConstructor: new (...args: any[]) => any, ...injectedServiceNames: string[]): (method: string) => RequestHandler;
export declare function makeRouteInvoker(bottle: Bottle, serviceName: string): (method: string) => RequestHandler;
export declare function makeMiddlewareInvoker(bottle: Bottle, middlewareFactory: Function): RequestHandler;
export declare function makeErrorMiddlewareInvoker(bottle: Bottle, middlewareFactory: Function): ErrorRequestHandler;
