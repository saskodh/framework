import {expect} from "chai";
import {stub} from "sinon";
import {
    Configuration, ConfigurationUtil,
    ConfigurationData, ProfiledPath
} from "../../../src/lib/decorators/ConfigurationDecorator";
import { ComponentScanUtil } from "../../../src/lib/decorators/ComponentScanDecorator";
import { Environment } from "../../../src/lib/di/Environment";
import { Profile } from "../../../src/lib/decorators/ProfileDecorators";

describe('ConfigurationData', function () {

    it('should load components', function () {
        // given
        let environment = new Environment();
        let configurationData = new ConfigurationData();
        configurationData.componentScanPaths.push(new ProfiledPath(['someProfile'], 'somePath'));
        let stubOnLoadAllComponents = stub(ComponentScanUtil, 'loadAllComponents');

        // when
        configurationData.loadAllComponents(environment);

        // then
        expect(stubOnLoadAllComponents.calledWith(configurationData, environment)).to.be.true;

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