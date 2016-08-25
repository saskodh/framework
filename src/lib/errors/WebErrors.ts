import { BaseError } from "./BaseError";

export class WebError extends BaseError {}

export class RouteHandlerError extends WebError {}

export class InterceptorError extends WebError {}