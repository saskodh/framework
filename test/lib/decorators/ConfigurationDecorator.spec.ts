import {expect} from "chai";
import {
    Configuration, ConfigurationUtil,
    ConfigurationData
} from "../../../src/lib/decorators/ConfigurationDecorator";

describe('ConfigurationDecorator', function () {

    it('should add metadata', function () {
        //given
        @Configuration()
        class A {}

        //when
        let configurationDataA = ConfigurationUtil.getConfigurationData(A);

        //then
        expect(configurationDataA).is.instanceOf(ConfigurationData);
    });

    it('should throw error when @Configuration is used more than once on the same class', function () {
        //given
        @Configuration()
        class A {}

        // when / then
        expect(Configuration().bind(this, A)).to.throw(Error);
    });
});

describe('ConfigurationUtil', function () {

    it('should throw error if target is not a configuration class', function () {
        //given
        class A {}

        //when / then
        expect(ConfigurationUtil.getConfigurationData.bind(this, A)).to.throw(Error);
    });
});