import {expect} from "chai";
import {spy} from "sinon";
import {Configuration, ConfigurationUtil} from "../../../src/lib/decorators/ConfigurationDecorator";
import { PropertySource, PropertySourceUtil } from "../../../src/lib/decorators/PropertySourceDecorator";

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

    it('should throw when not on @Configuration', function () {
        // given
        class A {}

        // when / then
        expect(PropertySource('somePath').bind(this, A)).to.throw(Error);
    });
});

describe('PropertySourceUtil', function () {

    it('should get properties from path', function () {
        // given
        // todo: put require in util (so it is mockable) and adjust source and tests accordingly
        // the first line is to be used while manually running, the second while building.
        // let propertiesPath = __dirname + "/../propertySourceTestFile.json";
        let propertiesPath = __dirname + "/../../../../test/lib/propertySourceTestFile.json";

        // when
        let resultProperties = PropertySourceUtil.getPropertiesFromPaths(propertiesPath);

        // then
        expect(resultProperties.get('key')).to.be.eq('val');
        expect(resultProperties.get('keyObj.objKey')).to.be.eq("objVal");
        expect(resultProperties.get('keyObj.objKeyArr')).to.be.eq('objValArrOne,objValArrTwo');
        expect(resultProperties.get('keyArr')).to.be.eq('arrValOne,arrValTwo');
    });

    it('should throw on wrong path', function () {
        // given / when / then
        expect(PropertySourceUtil.getPropertiesFromPaths.bind(PropertySourceUtil, 'wrongPath')).to.throw(Error);
    });
});