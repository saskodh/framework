import {expect} from "chai";
import {spy} from "sinon";
import {Configuration, ConfigurationUtil} from "../../../src/lib/decorators/ConfigurationDecorator";
import {PropertySource} from "../../../src/lib/decorators/PropertySourceDecorator";

describe('PropertySourceDecorator', function () {

    it('should add metadata', function () {
        // given
        let propertiesPath = __dirname + "/../propertySourceTestFile.json";
        let configurationUtilSpy = spy(ConfigurationUtil, 'getConfigurationData');
        // when
        @PropertySource("propertiesPathTwo")
        @PropertySource(propertiesPath)
        @Configuration()
        class A { }

        let configurationDataA = ConfigurationUtil.getConfigurationData(A);

        // then
        expect(configurationDataA.propertySourcePaths.length).to.be.eq(2);
        expect(configurationDataA.propertySourcePaths).to.include.members([propertiesPath, "propertiesPathTwo"]);
        expect(configurationUtilSpy.called).to.be.true;
    });
});