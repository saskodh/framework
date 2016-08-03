import {expect} from "chai";
import { Environment } from "../../../src/lib/di/Environment";

describe('Environment', function () {

    let LocalEnvironment = (<any> Environment);

    beforeEach(() => {
        let map = new Map<string, string>();
        map.set('key', 'val');
        LocalEnvironment.properties = map;
    });

    afterEach(() => {LocalEnvironment.properties = undefined; });

    it('should get property', function () {
        // given / when
        let resultOne = Environment.getProperty('key');
        let resultTwo = Environment.getProperty('keyTwo');
        let resultThree = Environment.getProperty('key', 'defaultVal');
        let resultFour = Environment.getProperty('keyTwo', 'defaultVal');

        // then
        expect(resultOne).to.be.eql('val');
        expect(resultTwo).to.be.undefined;
        expect(resultThree).to.be.eql('val');
        expect(resultFour).to.be.eql('defaultVal');
    });

    afterEach(() => {LocalEnvironment.properties = undefined; });

    it('should check for containing property', function () {
        // given / when
        let resultOne = Environment.containsProperty('key');
        let resultTwo = Environment.containsProperty('keyTwo');

        // then
        expect(resultOne).to.be.true;
        expect(resultTwo).to.be.false;
    });

    afterEach(() => {LocalEnvironment.properties = undefined; });

    it('should get required property', function () {
        // given / when
        let resultOne = Environment.getRequiredProperty('key');

        expect(Environment.getRequiredProperty.bind(Environment, 'keyTwo')).to.throw(Error);

        // then
        expect(resultOne).to.be.eql('val');
    });

    it('should throw on multiple methods when properties is not initialised', function () {
        // given
        LocalEnvironment.properties = undefined;

        // when / then
        expect(Environment.getProperty.bind(Environment, 'key')).to.throw(Error);
        expect(Environment.containsProperty.bind(Environment, 'key')).to.throw(Error);
        expect(Environment.getRequiredProperty.bind(Environment, 'key')).to.throw(Error);
    });

    it('should set properties', function () {
        // given
        let map = new Map<string, string>();
        map.set('keyTwo', 'valTwo');

        // when
        LocalEnvironment.setProperties(map);

        // then
        expect(LocalEnvironment.properties.get('key')).to.be.eql('val');
        expect(LocalEnvironment.properties.get('keyTwo')).to.be.eql('valTwo');
    });
});