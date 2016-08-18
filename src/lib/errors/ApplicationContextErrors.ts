import {BaseError} from "./BaseError";

export class ApplcationContextError extends BaseError {}

export class ComponentInitializationError extends ApplcationContextError {}

export class ComponentWiringError extends ApplcationContextError {}

export class PostConstructionError extends ApplcationContextError {}

export class PreDestroyError extends ApplcationContextError {}

export class PostProcessError extends ApplcationContextError {}