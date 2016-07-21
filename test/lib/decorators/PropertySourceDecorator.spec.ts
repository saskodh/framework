import {expect} from "chai";
import {Configuration, ConfigurationUtil} from "../../../src/lib/decorators/ConfigurationDecorator";
import {PropertySource} from "../../../src/lib/decorators/PropertySourceDecorator";
import {spy} from "sinon";

describe('PropertySourceDecorator', function () {

    it('should add metadata', function () {
        // given
        let properties = {
            "key1": "val1",
            "keyObj": {
                "name": "defaultName",
                "name2": "defaultName2"
            },
            "key2": "val2"
        };

        @Configuration()
        class A { }

        let configurationDataA = ConfigurationUtil.getConfigurationData(A);
        configurationDataA.properties.set('key3', 'val3');
        let configurationUtilSpy = spy(ConfigurationUtil, 'getConfigurationData');

        // when
        PropertySource(properties)(A);

        // then
        expect(configurationDataA.properties.get('key1')).to.be.eq('val1');
        expect(configurationDataA.properties.get('keyObj.name')).to.be.eq("defaultName");
        expect(configurationDataA.properties.get('keyObj.name2')).to.be.eq("defaultName2");
        expect(configurationDataA.properties.get('key2')).to.be.eq('val2');
        expect(configurationDataA.properties.get('key3')).to.be.eq('val3');
        expect(configurationUtilSpy.called).to.be.true;
    });
});