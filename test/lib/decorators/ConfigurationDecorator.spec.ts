import {expect} from "chai";
import {stub} from "sinon";
import {
    Configuration, ConfigurationUtil,
    ConfigurationData, ProfiledPath
} from "../../../src/lib/decorators/ConfigurationDecorator";
import { ComponentScanUtil } from "../../../src/lib/decorators/ComponentScanDecorator";
import { Environment } from "../../../src/lib/di/Environment";
import { Profile } from "../../../src/lib/decorators/ProfileDecorators";
import { ComponentUtil } from "../../../src/lib/decorators/ComponentDecorator";
import { DecoratorUsageError } from "../../../src/lib/errors/DecoratorUsageErrors";

describe('ConfigurationData', function () {

    it('should load components', function () {
        // given
        let environment = new Environment();
        let configurationData = new ConfigurationData();
        configurationData.componentScanPaths.push(new ProfiledPath(['profile1'], 'path1'));
        let stubOnComponentScanUtilGetComponentsFromPaths = stub(ComponentScanUtil, 'getComponentsFromPaths')
            .returns(['component', 'definitionPostProcessor', 'postProcessor']);
        let stubOnIsComponentDefinitionPostProcessor = stub(ComponentUtil, 'isComponentDefinitionPostProcessor');
        stubOnIsComponentDefinitionPostProcessor.withArgs('component').returns(false);
        stubOnIsComponentDefinitionPostProcessor.withArgs('definitionPostProcessor').returns(true);
        stubOnIsComponentDefinitionPostProcessor.withArgs('postProcessor').returns(false);
        let stubOnIsComponentPostProcessor = stub(ComponentUtil, 'isComponentPostProcessor');
        stubOnIsComponentPostProcessor.withArgs('component').returns(false);
        stubOnIsComponentPostProcessor.withArgs('definitionPostProcessor').returns(false);
        stubOnIsComponentPostProcessor.withArgs('postProcessor').returns(true);

        // when
        configurationData.loadAllComponents(environment);

        // then
        expect(configurationData.componentFactory.components.length).to.be.eq(1);
        expect(configurationData.componentDefinitionPostProcessorFactory.components.length).to.be.eq(1);
        expect(configurationData.componentPostProcessorFactory.components.length).to.be.eq(1);
        expect(stubOnComponentScanUtilGetComponentsFromPaths
            .calledWith(configurationData.componentScanPaths, environment)).to.be.true;
        // cleanup
        stubOnComponentScanUtilGetComponentsFromPaths.restore();
        stubOnIsComponentDefinitionPostProcessor.restore();
        stubOnIsComponentPostProcessor.restore();
    });
});

describe('ConfigurationDecorator', function () {

    it('should add metadata', function () {
        // given
        @Configuration()
        class A {}

        // when
        let configurationDataA = ConfigurationUtil.getConfigurationData(A);

        // then
        expect(configurationDataA).is.instanceOf(ConfigurationData);
    });

    it('should throw error when @Configuration is used more than once on the same class', function () {
        // given
        let createConfiguration = () => {
            @Configuration()
            @Configuration()
            class A {}
        };

        // when / then
        expect(createConfiguration).to.throw(DecoratorUsageError);
    });

    it('should throw when not on a class', function () {
        // given
        function SomeDecorator(...args) {} // tslint:disable-line

        class MyClass {
            myProperty: string;
            @SomeDecorator
            myFunction(str: string) {} // tslint:disable-line
        }

        // when / then
        expect(Configuration().bind(undefined, MyClass.prototype, 'myFunction', MyClass.prototype.myFunction))
            .to.throw(DecoratorUsageError);
        expect(Configuration().bind(undefined, MyClass.prototype, 'myProperty')).to.throw(DecoratorUsageError);
    });
});

describe('ConfigurationUtil', function () {

    it('should throw error if target is not a configuration class', function () {
        // given
        class A {}

        // when / then
        expect(ConfigurationUtil.getConfigurationData.bind(ConfigurationUtil, A)).to.throw(Error);
    });

    it('should add path for component scan', function () {
        // given
        @Profile('someProfile')
        @Configuration()
        class A {}

        // when
        ConfigurationUtil.addComponentScanPath(A, 'somePath');
        ConfigurationUtil.addComponentScanPath(A, 'someOtherPath');

        // then
        expect(ConfigurationUtil.getConfigurationData(A).componentScanPaths).to.be.eql(
            [{profiles: ['someProfile'], path: 'somePath'}, {profiles: ['someProfile'], path: 'someOtherPath'}]);
    });

    it('should add path for property source', function () {
        // given
        @Profile('someProfile')
        @Configuration()
        class A {}

        // when
        ConfigurationUtil.addPropertySourcePath(A, 'somePath');
        ConfigurationUtil.addPropertySourcePath(A, 'someOtherPath');

        // then
        expect(ConfigurationUtil.getConfigurationData(A).propertySourcePaths).to.be.eql(
            [{profiles: ['someProfile'], path: 'somePath'}, {profiles: ['someProfile'], path: 'someOtherPath'}]);
    });
});