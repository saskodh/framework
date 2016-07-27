import {expect} from "chai";
import {stub} from "sinon";
import {
    Configuration, ConfigurationUtil,
    ConfigurationData
} from "../../../src/lib/decorators/ConfigurationDecorator";
import { PropertySourceUtil } from "../../../src/lib/decorators/PropertySourceDecorator";
import { ComponentScanUtil } from "../../../src/lib/decorators/ComponentScanDecorator";
import { ComponentUtil } from "../../../src/lib/decorators/ComponentDecorator";

describe('ConfigurationData', function () {

    it('should load properties', function () {
        // given
        let configurationData = new ConfigurationData();
        configurationData.propertySourcePaths.push('somePath');
        let map = new Map();
        map.set('key', 'val');
        let stubOnGetPropertiesFromPaths = stub(PropertySourceUtil, 'getPropertiesFromPaths').returns(map);

        // when
        configurationData.loadAllProperties();

        // then
        expect(configurationData.properties.get('key')).is.eql('val');
        expect(stubOnGetPropertiesFromPaths.calledWith('somePath')).to.be.true;

        stubOnGetPropertiesFromPaths.restore();
    });

    it('should load components', function () {
        // given
        let configurationData = new ConfigurationData();
        configurationData.componentScanPaths = ['path1'];
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
        configurationData.loadAllComponents();

        // then
        expect(configurationData.componentFactory.components.length).to.be.eq(1);
        expect(configurationData.componentDefinitionPostProcessorFactory.components.length).to.be.eq(1);
        expect(configurationData.componentPostProcessorFactory.components.length).to.be.eq(1);
        // cleanup
        stubOnComponentScanUtilGetComponentsFromPaths.restore();
        stubOnIsComponentDefinitionPostProcessor.restore();
        stubOnIsComponentPostProcessor.restore();
    });

    it('should throw error when @Configuration is used more than once on the same class', function () {
        // given
        let createConfiguration = () => {
            @Configuration()
            @Configuration()
            class A {}
        };

        // when / then
        expect(createConfiguration).to.throw(Error);
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
        expect(createConfiguration).to.throw(Error);
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
        @Configuration()
        class A {}

        // when
        ConfigurationUtil.addComponentScanPath(A, 'somePath');
        ConfigurationUtil.addComponentScanPath(A, 'someOtherPath');

        // then
        expect(ConfigurationUtil.getConfigurationData(A).componentScanPaths)
            .to.include.members(['somePath', 'someOtherPath']);
    });

    it('should add path for property source', function () {
        // given
        @Configuration()
        class A {}

        // when
        ConfigurationUtil.addPropertySourcePath(A, 'somePath');
        ConfigurationUtil.addPropertySourcePath(A, 'someOtherPath');

        // then
        expect(ConfigurationUtil.getConfigurationData(A).propertySourcePaths)
            .to.include.members(['somePath', 'someOtherPath']);
    });


});