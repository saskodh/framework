// NOTE: prototype for the ES7 Reflect API. Added for easier manipulating with metadata.
require('reflect-metadata');

export {Component} from "./lib/decorators/ComponentDecorator";
export {ComponentScan} from "./lib/decorators/ComponentScanDecorator";
export {Configuration} from "./lib/decorators/ConfigurationDecorator";
export {Controller} from "./lib/decorators/ControllerDecorator";
export {Inject, Value, Autowire} from "./lib/decorators/InjectionDecorators";
export {Profile} from "./lib/decorators/ComponentDecorator";
export {PropertySource} from "./lib/decorators/PropertySourceDecorator";
export {RequestMapping, RequestMappingConfig, RequestMethod} from "./lib/decorators/RequestMappingDecorator";

export {Cacheable} from "./lib/decorators/CacheableDecorator";
export {CacheEvict} from "./lib/decorators/CacheEvictDecorator";
export {EnableCaching} from "./lib/decorators/EnableCachingDecorator";

export {ApplicationContext} from "./lib/di/ApplicationContext";
export {Dispatcher} from "./lib/dispatcher/Dispatcher";
export {Interceptor} from "./lib/interceptors/InterceptorDecorator";
export {ComponentDefinitionPostProcessor} from "./lib/processors/ComponentDefinitionPostProcessor";
export {ComponentPostProcessor} from "./lib/processors/ComponentPostProcessor";