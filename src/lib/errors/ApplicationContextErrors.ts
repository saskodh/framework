import {BaseError} from "./BaseError";

export class ApplicationContextError extends BaseError {}

export class ComponentInitializationError extends ApplicationContextError {}

export class ComponentWiringError extends ApplicationContextError {}

export class PostConstructionError extends ApplicationContextError {}

export class PreDestructionError extends ApplicationContextError {}

export class PostProcessError extends ApplicationContextError {}