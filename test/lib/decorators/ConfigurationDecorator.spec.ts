import {expect} from "chai";
import {stub} from "sinon";
import {
    Configuration, ConfigurationUtil,
    ConfigurationData
} from "../../../src/lib/decorators/ConfigurationDecorator";

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
        expect(ConfigurationUtil.getConfigurationData.bind(this, A)).to.throw(Error);
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

    it('should set properties from path', function () {
        // given
        // the first line is to be used while manually running, the second while building.
        // let propertiesPath = __dirname + "/../propertySourceTestFile.json";
        let propertiesPath = __dirname + "/../../../../test/lib/propertySourceTestFile.json";

        @Configuration()
        class A { }

        let configurationDataA = ConfigurationUtil.getConfigurationData(A);
        configurationDataA.propertySourcePaths.push(propertiesPath);
        configurationDataA.propertySourcePaths.push("wrongPath");
        configurationDataA.properties.set('key3', 'val3');
        let consoleErrorStub = stub(console, 'error');

        console.log('path ' + propertiesPath);
        // when / then
        expect(ConfigurationUtil.setPropertiesFromPath.bind(ConfigurationUtil, configurationDataA)).to.throw(Error);
        expect(configurationDataA.properties.get('key')).to.be.eq('val');
        expect(configurationDataA.properties.get('keyObj.objKey')).to.be.eq("objVal");
        expect(configurationDataA.properties.get('keyObj.objKeyArr')).to.be.eq('objValArrOne,objValArrTwo');
        expect(configurationDataA.properties.get('keyArr')).to.be.eq('arrValOne,arrValTwo');
        expect(configurationDataA.properties.get('key3')).to.be.eq('val3');
        expect(consoleErrorStub.called).to.be.true;
    });
});