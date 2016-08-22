import 'zone.js';
import "zone.js/dist/long-stack-trace-zone.js";

// NOTE: prototype for the ES7 Reflect API. Added for easier manipulating with metadata.
import "reflect-metadata";

export {Component} from "./lib/decorators/ComponentDecorator";
export {Qualifier} from "./lib/decorators/QualifierDecorator";
export {ComponentScan} from "./lib/decorators/ComponentScanDecorator";
export {Import} from "./lib/decorators/ImportDecorator";
export {Configuration} from "./lib/decorators/ConfigurationDecorator";
export {Controller} from "./lib/decorators/ControllerDecorator";
export {Inject, DynamicInject, Value, Autowired, ThreadLocal} from "./lib/decorators/InjectionDecorators";
export {PostConstruct, PreDestroy} from "./lib/decorators/LifeCycleHooksDecorators";
export {Profile, ActiveProfiles} from "./lib/decorators/ProfileDecorators";
export {PropertySource} from "./lib/decorators/PropertySourceDecorator";
export {View} from "./lib/decorators/ViewDecorator";
export {RequestMapping, RequestMappingConfig, RequestMethod} from "./lib/decorators/RequestMappingDecorator";
export {Interceptor} from "./lib/decorators/InterceptorDecorator";
export {Order} from "./lib/decorators/OrderDecorator";

export { RequestContext, REQUEST_TOKEN, RESPONSE_TOKEN } from "./lib/web/context/RequestContext";
export { RequestContextHolder } from "./lib/web/context/RequestContextHolder";

export {ApplicationContext} from "./lib/di/ApplicationContext";
export {Dispatcher} from "./lib/web/Dispatcher";
export {ComponentDefinitionPostProcessor} from "./lib/processors/ComponentDefinitionPostProcessor";
export {ComponentPostProcessor} from "./lib/processors/ComponentPostProcessor";
export {Environment} from "./lib/di/Environment";

export {ApplcationContextError, ComponentInitializationError, ComponentWiringError,
    PostConstructionError, PreDestroyError, PostProcessError } from "./lib/errors/ApplicationContextErrors"
export {BadArgumentError} from "./lib/errors/BadArgumentError"
export {BaseError} from "./lib/errors/BaseError"
export {DecoratorUsageError, DecoratorUsageTypeError} from "./lib/errors/DecoratorUsageErrors"
export {InjectionError} from "./lib/errors/InjectionError"
export {WebError, RouteHandlerError, InterceptorError} from "./lib/errors/WebErrors"