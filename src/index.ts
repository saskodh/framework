// NOTE: reference path is temporary workaround (see https://github.com/angular/zone.js/issues/297)
///<reference path="../node_modules/zone.js/dist/zone.js.d.ts"/>
require('zone.js');
import "zone.js/dist/long-stack-trace-zone.js";

// NOTE: prototype for the ES7 Reflect API. Added for easier manipulating with metadata.
import "reflect-metadata";

export {Component} from "./lib/decorators/ComponentDecorator";
export {ComponentScan} from "./lib/decorators/ComponentScanDecorator";
export {Configuration} from "./lib/decorators/ConfigurationDecorator";
export {Controller} from "./lib/decorators/ControllerDecorator";
export {Inject, Value, Autowire, ThreadLocal} from "./lib/decorators/InjectionDecorators";
export {Profile} from "./lib/decorators/ComponentDecorator";
export {PropertySource} from "./lib/decorators/PropertySourceDecorator";
export {RequestMapping, RequestMappingConfig, RequestMethod} from "./lib/decorators/RequestMappingDecorator";

export {ApplicationContext} from "./lib/di/ApplicationContext";
export {Dispatcher} from "./lib/dispatcher/Dispatcher";
export {Interceptor} from "./lib/interceptors/InterceptorDecorator";
export {ComponentDefinitionPostProcessor} from "./lib/processors/ComponentDefinitionPostProcessor";
export {ComponentPostProcessor} from "./lib/processors/ComponentPostProcessor";