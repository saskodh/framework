import * as _ from "lodash";
import * as fileSystem from "fs";
import * as path_module from "path";
import {ConfigurationData, ConfigurationUtil} from "./ConfigurationDecorator";
import {COMPONENT_DECORATOR_TOKEN} from "./ComponentDecorator";

// todo revert the logic in the function to match it's name
let getModulesStartingFrom = function* (path: string) {
    let stat = fileSystem.lstatSync(path);
    if (stat.isDirectory()) {
        // we have a directory: do a tree walk
        var files = fileSystem.readdirSync(path);
        for (let file of files) {
            // if it's JavaScript file load it
            if (path_module.extname(file) === '.js') {
                yield * getModulesStartingFrom(path_module.join(path, file));
            }
        }
    } else {
        console.log('Loading dynamically by ComponentScan: ', path);
        yield require(path);
    }
};

let getComponentsFromModule = function (module): Array<any> {
    return _.filter(module, (exportable) => exportable[COMPONENT_DECORATOR_TOKEN]);
};

let loadComponents = function (path: string, configurationData: ConfigurationData) {
    for (let module of getModulesStartingFrom(path)) {
        for (let component of getComponentsFromModule(module)) {
            configurationData.componentFactory.components.push(component);
        }
    }
};

export function ComponentScan (path) {
    return function (target) {
        var configurationData = ConfigurationUtil.getConfigurationData(target);
        if (!configurationData) throw '@ComponentScan is allowed on @Configuration classes only!';

        loadComponents(path, configurationData);
    }
}