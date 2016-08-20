// NOTE: reference path is temporary workaround (see https://github.com/angular/zone.js/issues/297)
///<reference path="../node_modules/zone.js/dist/zone.js.d.ts"/>
require('zone.js');
import "zone.js/dist/long-stack-trace-zone.js";

// NOTE: prototype for the ES7 Reflect API. Added for easier manipulating with metadata.
import "reflect-metadata";

export {Component} from "./lib/decorators/ComponentDecorator";
export {Qualifier} from "./lib/decorators/QualifierDecorator";
export {ComponentScan} from "./lib/decorators/ComponentScanDecorator";
export {Import} from "./lib/decorators/ImportDecorator";
export {Configuration} from "./lib/decorators/ConfigurationDecorator";
export {Controller} from "./lib/decorators/ControllerDecorator";
export {Inject, Value, Autowire, ThreadLocal} from "./lib/decorators/InjectionDecorators";
export {Profile} from "./lib/decorators/ComponentDecorator";
export {PropertySource} from "./lib/decorators/PropertySourceDecorator";
export {View} from "./lib/decorators/ViewDecorator";
export {RequestMapping, RequestMappingConfig, RequestMethod} from "./lib/decorators/RequestMappingDecorator";
export {Interceptor} from "./lib/decorators/InterceptorDecorator";
export {Order} from "./lib/decorators/OrderDecorator";

export {ApplicationContext} from "./lib/di/ApplicationContext";
export {Dispatcher} from "./lib/web/Dispatcher";
export {ComponentDefinitionPostProcessor} from "./lib/processors/ComponentDefinitionPostProcessor";
export {ComponentPostProcessor} from "./lib/processors/ComponentPostProcessor";
export {Environment} from "./lib/di/Environment";