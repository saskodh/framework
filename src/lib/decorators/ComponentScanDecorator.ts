import * as _ from "lodash";
import * as fileSystem from "fs";
import * as path_module from "path";
import { ConfigurationData, ConfigurationUtil } from "./ConfigurationDecorator";
import { ComponentUtil } from "./ComponentDecorator";

/**
 *A decorator for setting up project files to be component-scanned.
 * May only be put on @Configuration() classes.
 * @param Path for the root directory. (For relative paths use __dirname)
 */
export function ComponentScan(path) {
    return function (target) {
        let configurationData;
        try {
            configurationData = ConfigurationUtil.getConfigurationData(target);
        } catch (error) {
            throw new Error('@ComponentScan is allowed on @Configuration classes only!');
        }
        ConfigurationUtil.addComponentScanPath(target, path);
    };
}

export class ComponentScanUtil {
    static loadAllComponents(configurationData: ConfigurationData) {
        for (let path of configurationData.componentScanPaths) {
            this.loadComponentsFromPath(path, configurationData);
        }
    };

    private static * getModulesStartingFrom(path: string) {
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
                yield * this.getModulesStartingFrom(filePath);
            }
        }
    };

    private static getComponentsFromModule(module): Array<any> {
        return _.filter(module, (exportable) => ComponentUtil.isComponent(exportable));
    };

    private static loadComponentsFromPath(path: string, configurationData: ConfigurationData) {
        for (let module of this.getModulesStartingFrom(path)) {
            for (let component of this.getComponentsFromModule(module)) {
                configurationData.componentFactory.components.push(component);
            }
        }
    };
}