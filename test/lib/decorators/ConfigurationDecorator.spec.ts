import {expect} from "chai";
import {stub} from "sinon";
import {
    Configuration, ConfigurationUtil,
    ConfigurationData
} from "../../../src/lib/decorators/ConfigurationDecorator";
import { PropertySourceUtil } from "../../../src/lib/decorators/PropertySourceDecorator";
import { ComponentScanUtil } from "../../../src/lib/decorators/ComponentScanDecorator";
import { DecoratorUsageError } from "../../../src/lib/errors/DecoratorUsageError";

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
        configurationData.componentScanPaths.push('somePath');
        let stubOnLoadAllComponents = stub(ComponentScanUtil, 'loadAllComponents');

        // when
        configurationData.loadAllComponents();

        // then
        expect(stubOnLoadAllComponents.calledWith(configurationData)).to.be.true;

        stubOnLoadAllComponents.restore();
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
        expect(createConfiguration).to.throw(DecoratorUsageError);
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