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
export {Inject, DynamicInject, Value, Autowire, ThreadLocal} from "./lib/decorators/InjectionDecorators";
export {PostConstruct, PreDestroy} from "./lib/decorators/LifeCycleHooksDecorators";
export {Profile, ActiveProfiles} from "./lib/decorators/ProfileDecorators";
export {PropertySource} from "./lib/decorators/PropertySourceDecorator";
export {View} from "./lib/decorators/ViewDecorator";
export {RequestMapping, RequestMappingConfig, RequestMethod} from "./lib/decorators/RequestMappingDecorator";
export {Interceptor} from "./lib/decorators/InterceptorDecorator";
export {Order} from "./lib/decorators/OrderDecorator";
export { RequestContext, REQUEST_TOKEN, RESPONSE_TOKEN } from "./lib/web/context/RequestContext";
export { RequestContextHolder } from "./lib/web/context/RequestContextHolder";

export {Cacheable} from "./lib/decorators/CacheableDecorator";
export {CacheEvict} from "./lib/decorators/CacheEvictDecorator";
export {EnableCaching} from "./lib/decorators/EnableCachingDecorator";

export {ApplicationContext} from "./lib/di/ApplicationContext";
export {ComponentDefinitionPostProcessor} from "./lib/processors/ComponentDefinitionPostProcessor";
export {ComponentPostProcessor} from "./lib/processors/ComponentPostProcessor";
export {Aspect, Before, After, AfterReturning, AfterThrowing, Around} from "./lib/decorators/AspectDecorator";
export {Environment} from "./lib/di/Environment";