import {expect} from "chai";
import { Configuration, ConfigurationUtil, ProfiledPath } from "../../../src/lib/decorators/ConfigurationDecorator";
import {Import} from "../../../src/lib/decorators/ImportDecorator";
import "reflect-metadata";
import { BadArgumentError } from "../../../src/lib/errors/BadArgumentError";
import { DecoratorUsageError } from "../../../src/lib/errors/DecoratorUsageError";

describe('ImportDecorator', function () {

    it('should merge the metadata from the given configuration classes', function () {
        // given
        @Configuration()
        class A { }

        @Configuration()
        class AppConfig {}

        let csPath1 = new ProfiledPath(['activeProfile'], 'csPath1');
        let psPath1 = new ProfiledPath(['activeProfile'], 'psPath1');
        let csPath2 = new ProfiledPath(['activeProfile'], 'csPath2');
        let psPath2 = new ProfiledPath(['activeProfile'], 'psPath2');

        let configurationDataA = ConfigurationUtil.getConfigurationData(A);
        configurationDataA.componentFactory.components.push('c1');
        configurationDataA.componentDefinitionPostProcessorFactory.components.push('dpp1');
        configurationDataA.componentPostProcessorFactory.components.push('pp1');
        configurationDataA.componentScanPaths.push(csPath1);
        configurationDataA.propertySourcePaths.push(psPath1);

        let configurationDataAppConfig = ConfigurationUtil.getConfigurationData(AppConfig);
        configurationDataAppConfig.componentFactory.components.push('c2');
        configurationDataAppConfig.componentDefinitionPostProcessorFactory.components.push('dpp2');
        configurationDataAppConfig.componentPostProcessorFactory.components.push('pp2');
        configurationDataAppConfig.componentScanPaths.push(csPath2);
        configurationDataAppConfig.propertySourcePaths.push(psPath2);

        // when
        Import(A)(AppConfig);

        // then
        expect(configurationDataAppConfig.componentFactory.components).to.include.members(['c1', 'c2']);
        expect(configurationDataAppConfig.componentDefinitionPostProcessorFactory.components)
            .to.include.members(['dpp1', 'dpp2']);
        expect(configurationDataAppConfig.componentPostProcessorFactory.components)
            .to.include.members(['pp1', 'pp2']);
        expect(configurationDataAppConfig.componentScanPaths).to.include.members([csPath1, csPath2]);
        expect(configurationDataAppConfig.propertySourcePaths).to.include.members([psPath1, psPath2]);
    });

    it('should throw when not on a configuration class', function () {
        // given
        @Configuration()
        class A { }

        class MyClass {
            myProperty: string;
            myFunction() {} // tslint:disable-line
        }

        // when / then
        expect(Import(A).bind(undefined, MyClass)).to.throw(DecoratorUsageError);
        expect(Import(A).bind(undefined, MyClass, 'myFunction', MyClass.prototype.myFunction))
            .to.throw(DecoratorUsageError);
        expect(Import(A).bind(undefined, MyClass, 'myProperty')).to.throw(DecoratorUsageError);
    });

    it('should throw when non-configuration is passed', function () {
        // given
        class A { }

        @Configuration()
        class AppConfig {}

        // when / then
        expect(Import(A).bind(undefined, AppConfig)).to.throw(BadArgumentError);
        expect(Import('someString').bind(undefined, AppConfig)).to.throw(BadArgumentError);
    });
});