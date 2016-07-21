import * as _ from "lodash";
import * as fileSystem from "fs";
import * as path_module from "path";
import { ConfigurationData, ConfigurationUtil } from "./ConfigurationDecorator";
import { COMPONENT_DECORATOR_TOKEN } from "./ComponentDecorator";

let getModulesStartingFrom = function*(path: string) {
    if (!fileSystem.lstatSync(path).isDirectory()) {
        throw new Error(`Given path must be a valid directory. Path: ${path}`);
    }

    let files = fileSystem.readdirSync(path);
    for (let fileName of files) {
        let filePath = path_module.join(path, fileName);
        let lstat = fileSystem.lstatSync(filePath);

        // if it's JavaScript file load it
        if (lstat.isFile() && path_module.extname(fileName) === '.js') {
            console.log(`Loading dynamically by @ComponentScan: ${fileName} (${filePath})`);
            yield require(filePath);
        }

        if (lstat.isDirectory()) {
            yield * getModulesStartingFrom(filePath);
        }
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

export function ComponentScan(path) {
    return function (target) {
        let configurationData = ConfigurationUtil.getConfigurationData(target);
        if (!configurationData) {
            throw '@ComponentScan is allowed on @Configuration classes only!';
        }

        loadComponents(path, configurationData);
    };
}