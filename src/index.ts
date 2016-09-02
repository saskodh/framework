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
export {Aspect} from "./lib/decorators/aspect/AspectDecorator";
export {Before} from "./lib/decorators/aspect/BeforeDecorator";
export {After} from "./lib/decorators/aspect/AfterDecorator";
export {AfterReturning} from "./lib/decorators/aspect/AfterReturningDecorator";
export {AfterThrowing} from "./lib/decorators/aspect/AfterThrowingDecorator";
export {Around} from "./lib/decorators/aspect/AroundDecorator";
export {Cacheable} from "./lib/decorators/cache/CacheableDecorator";
export {CacheEvict} from "./lib/decorators/cache/CacheEvictDecorator";
export {CachePut} from "./lib/decorators/cache/CachePutDecorator";
export {EnableCaching} from "./lib/decorators/cache/EnableCachingDecorator";

export { RequestContext, REQUEST_TOKEN, RESPONSE_TOKEN } from "./lib/web/context/RequestContext";
export { RequestContextHolder } from "./lib/web/context/RequestContextHolder";

export {ApplicationContext} from "./lib/di/ApplicationContext";
export {ComponentDefinitionPostProcessor, IComponentDefinitionPostProcessor}
    from "./lib/processors/ComponentDefinitionPostProcessor";
export {ComponentPostProcessor, IComponentPostProcessor} from "./lib/processors/ComponentPostProcessor";
export {Environment} from "./lib/di/Environment";
export { LoggerFactory } from "./lib/helpers/logging/LoggerFactory";

// exported error definitions
export {ApplicationContextError, ComponentInitializationError, ComponentWiringError,
    PostConstructionError, PreDestructionError, PostProcessError } from "./lib/errors/ApplicationContextErrors"
export {BadArgumentError, DecoratorBadArgumentError} from "./lib/errors/BadArgumentErrors"
export {BaseError} from "./lib/errors/BaseError"
export {DecoratorUsageError, DecoratorUsageTypeError} from "./lib/errors/DecoratorUsageErrors"
export {InjectionError} from "./lib/errors/InjectionError"
export {InvalidUsageError} from "./lib/errors/InvalidUsageError"
export {WebError, RouteHandlerError, InterceptorError} from "./lib/errors/WebErrors"
export {AspectError, AfterAdviceError, AfterReturningAdviceError, BeforeAdviceError,
    AfterThrowingAdviceError} from "./lib/errors/AspectErrors"