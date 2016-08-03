import {expect} from "chai";
import { Environment } from "../../../src/lib/di/Environment";

describe('Environment', function () {

    let environment = new Environment(new Map<string, string>(), []);
    let localEnvironment = <any> environment;
    beforeEach(() => {
        let map = new Map<string, string>();
        map.set('key', 'val');
        map.set('keyThree', 'valThree');
        map.set(localEnvironment.ACTIVE_PROFILES_PROPERTY_KEY, 'activeProfile');
        map.set(localEnvironment.DEFAULT_PROFILES_PROPERTY_KEY, 'defaultProfile');
        localEnvironment.properties = map;
    });

    afterEach(() => {localEnvironment.properties = undefined; });

    it('should get property', function () {
        // given / when
        let resultOne = localEnvironment.getProperty('key');
        let resultTwo = localEnvironment.getProperty('keyTwo');
        let resultThree = localEnvironment.getProperty('key', 'defaultVal');
        let resultFour = localEnvironment.getProperty('keyTwo', 'defaultVal');

        // then
        expect(resultOne).to.be.eql('val');
        expect(resultTwo).to.be.undefined;
        expect(resultThree).to.be.eql('val');
        expect(resultFour).to.be.eql('defaultVal');
    });

    afterEach(() => {localEnvironment.properties = undefined; });

    it('should check for containing property', function () {
        // given / when
        let resultOne = localEnvironment.containsProperty('key');
        let resultTwo = localEnvironment.containsProperty('keyTwo');

        // then
        expect(resultOne).to.be.true;
        expect(resultTwo).to.be.false;
    });

    afterEach(() => {localEnvironment.properties = undefined; });

    it('should get required property', function () {
        // given / when
        let resultOne = localEnvironment.getRequiredProperty('key');

        expect(localEnvironment.getRequiredProperty.bind(Environment, 'keyTwo')).to.throw(Error);

        // then
        expect(resultOne).to.be.eql('val');
    });

    it('should check for accepting profiles', function () {
        // given / when / then
        expect(localEnvironment.acceptsProfiles('notActiveProfile', 'activeProfile')).to.be.true;
        expect(localEnvironment.acceptsProfiles('notActiveProfile', 'defaultProfile')).to.be.false;
        localEnvironment.properties.delete(localEnvironment.ACTIVE_PROFILES_PROPERTY_KEY);
        expect(localEnvironment.acceptsProfiles('notActiveProfile', 'activeProfile')).to.be.false;
        expect(localEnvironment.acceptsProfiles('notActiveProfile', 'defaultProfile')).to.be.true;
        localEnvironment.properties.delete(localEnvironment.DEFAULT_PROFILES_PROPERTY_KEY);
        expect(localEnvironment.acceptsProfiles('notActiveProfile', 'activeProfile')).to.be.false;
        expect(localEnvironment.acceptsProfiles('notActiveProfile', 'defaultProfile')).to.be.false;
    });

    it('should get active profiles', function () {
        // given / when / then
        expect(localEnvironment.getActiveProfiles()).to.be.eql(['activeProfile']);
        localEnvironment.properties.delete(localEnvironment.ACTIVE_PROFILES_PROPERTY_KEY);
        expect(localEnvironment.getActiveProfiles()).to.be.undefined;

    });

    it('should get default profiles', function () {
        // given / when / then
        expect(localEnvironment.getDefaultProfiles()).to.be.eql(['defaultProfile']);
        localEnvironment.properties.delete(localEnvironment.DEFAULT_PROFILES_PROPERTY_KEY);
        expect(localEnvironment.getDefaultProfiles()).to.be.undefined;
    });

    it('should throw on multiple methods when properties is not initialised', function () {
        // given
        localEnvironment.properties = undefined;

        // when / then
        expect(localEnvironment.getProperty.bind(Environment, 'key')).to.throw(Error);
        expect(localEnvironment.containsProperty.bind(Environment, 'key')).to.throw(Error);
        expect(localEnvironment.getRequiredProperty.bind(Environment, 'key')).to.throw(Error);
        expect(localEnvironment.acceptsProfiles.bind(Environment, 'activeProfile')).to.throw(Error);
        expect(localEnvironment.getActiveProfiles.bind(Environment)).to.throw(Error);
        expect(localEnvironment.getDefaultProfiles.bind(Environment)).to.throw(Error);
    });

    it('should set properties', function () {
        // given
        let map = new Map<string, string>();
        map.set('keyTwo', 'valTwo');
        map.set('keyThree', 'valThree');

        // when
        localEnvironment.setProperties(map);

        // then
        expect(localEnvironment.properties.get('key')).to.be.eql('val');
        expect(localEnvironment.properties.get('keyTwo')).to.be.eql('valTwo');
        expect(localEnvironment.properties.get('keyThree')).to.be.eql('valThree,valThree');
    });
});