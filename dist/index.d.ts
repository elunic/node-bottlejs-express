import * as Bottle from 'bottlejs';
import * as Express from 'express';
export declare function makeRouteInvoker(bottle: Bottle, serviceName: string): (methodName: string) => any;
export declare function makeMiddlewareInvoker(bottle: Bottle, middlewareFactory: Function): Express.RequestHandler;
export declare function makeErrorMiddlewareInvoker(bottle: Bottle, middlewareFactory: Function): Express.ErrorRequestHandler;
