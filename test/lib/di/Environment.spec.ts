import {expect} from "chai";
import {stub} from "sinon";
import { Environment } from "../../../src/lib/di/Environment";
import { ProcessHandler } from "../../../src/lib/helpers/ProcessHandler";
import { PropertySourceUtil } from "../../../src/lib/decorators/PropertySourceDecorator";
import { ProfiledPath } from "../../../src/lib/decorators/ConfigurationDecorator";

describe('Environment', function () {

    let environment;
    let localEnvironment;

    beforeEach(() => {
        environment = new Environment();
        localEnvironment = <any> environment;
    });

    afterEach(() => localEnvironment.properties = undefined);

    it('should initialize correctly', () => {
        // given
        let stubOnGetProcessProperties = stub(ProcessHandler, 'getProcessProperties').returns('process props');
        let stubOnGetNodeProperties = stub(ProcessHandler, 'getNodeProperties').returns('node props');
        let stubOnGetEnvironmentProperties = stub(ProcessHandler, 'getEnvironmentProperties').returns('env props');

        // when
        environment = new Environment();
        localEnvironment = <any> environment;

        // then
        expect(localEnvironment.processProperties).to.equal('process props');
        expect(localEnvironment.nodeProperties).to.equal('node props');
        expect(localEnvironment.processEnvProperties).to.equal('env props');

        // clean-up
        stubOnGetProcessProperties.restore();
        stubOnGetNodeProperties.restore();
        stubOnGetEnvironmentProperties.restore();
    });

    it('should get property', function () {
        // given
        let processProperties = new Map<string, string>();
        let nodeProperties = new Map<string, string>();
        let processEnvProperties = new Map<string, string>();
        let applicationProperties = new Map<string, string>();
        processProperties.set('key1', 'val1');
        nodeProperties.set('key2', 'val2');
        nodeProperties.set('key1', 'val2');
        processEnvProperties.set('key3', 'val3');
        processEnvProperties.set('key2', 'val3');
        applicationProperties.set('key4', 'val4');
        applicationProperties.set('key3', 'val4');
        localEnvironment.processProperties = processProperties;
        localEnvironment.nodeProperties = nodeProperties;
        localEnvironment.processEnvProperties = processEnvProperties;
        localEnvironment.applicationProperties = applicationProperties;

        // when
        let result1 = localEnvironment.getProperty('key1', 'defaultVal');
        let result2 = localEnvironment.getProperty('key2', 'defaultVal');
        let result3 = localEnvironment.getProperty('key3', 'defaultVal');
        let result4 = localEnvironment.getProperty('key4', 'defaultVal');
        let resultDef = localEnvironment.getProperty('noKey', 'defaultVal');
        let resultUndef = localEnvironment.getProperty('noKey');

        // then
        expect(result1).to.be.eql('val1');
        expect(result2).to.be.eql('val2');
        expect(result3).to.be.eql('val3');
        expect(result4).to.be.eql('val4');
        expect(resultDef).to.be.eql('defaultVal');
        expect(resultUndef).to.be.undefined;
    });

    it('should check for containing property', function () {
        // given
        let stubOnGetProperty = stub(localEnvironment, 'getProperty');
        stubOnGetProperty.withArgs('key').returns('val');
        stubOnGetProperty.withArgs('keyTwo').returns(undefined);

        // when
        let resultOne = localEnvironment.containsProperty('key');
        let resultTwo = localEnvironment.containsProperty('keyTwo');

        // then
        expect(resultOne).to.be.true;
        expect(resultTwo).to.be.false;

        stubOnGetProperty.restore();
    });

    it('should get required property', function () {
        // given
        let stubOnGetProperty = stub(localEnvironment, 'getProperty');
        stubOnGetProperty.withArgs('key').returns('val');
        stubOnGetProperty.withArgs('keyTwo').returns(undefined);

        // when
        let resultOne = localEnvironment.getRequiredProperty('key');
        expect(localEnvironment.getRequiredProperty.bind(localEnvironment, 'keyTwo')).to.throw(Error);

        // then
        expect(resultOne).to.be.eql('val');

        stubOnGetProperty.restore();
    });

    it('should check for accepting profiles', function () {
        // given
        let stubOnGetActiveProfiles = stub(localEnvironment, 'getActiveProfiles').returns(['activeProfile']);
        let stubOnGetDefaultProfiles = stub(localEnvironment, 'getDefaultProfiles').returns(['defaultProfile']);

        // when / then
        expect(localEnvironment.acceptsProfiles.bind(localEnvironment)).to.throw(Error);

        expect(localEnvironment.acceptsProfiles('notActiveProfile', 'activeProfile')).to.be.true;
        expect(localEnvironment.acceptsProfiles('notActiveProfile', 'defaultProfile')).to.be.false;

        stubOnGetActiveProfiles.returns([]);
        expect(localEnvironment.acceptsProfiles('notActiveProfile', 'activeProfile')).to.be.false;
        expect(localEnvironment.acceptsProfiles('notActiveProfile', 'defaultProfile')).to.be.true;

        stubOnGetDefaultProfiles.returns([]);
        expect(localEnvironment.acceptsProfiles('notActiveProfile', 'activeProfile')).to.be.false;
        expect(localEnvironment.acceptsProfiles('notActiveProfile', 'defaultProfile')).to.be.false;

        stubOnGetActiveProfiles.restore();
        stubOnGetDefaultProfiles.restore();
    });

    it('should get active profiles', function () {
        // given
        localEnvironment.activeProfiles = ['activeProfile'];

        // when / then
        expect(localEnvironment.getActiveProfiles()).to.be.eql(['activeProfile']);
        localEnvironment.activeProfiles = [];
        expect(localEnvironment.getActiveProfiles()).to.be.instanceOf(Array);
        expect(localEnvironment.getActiveProfiles()).to.be.empty;
    });

    it('should get default profiles', function () {
        // given
        let stubOnGetProperty = stub(localEnvironment, 'getProperty').returns('defaultProfile,otherProfile');

        // when / then
        expect(localEnvironment.getDefaultProfiles()).to.be.eql(['defaultProfile', 'otherProfile']);
        stubOnGetProperty.returns(undefined);
        expect(localEnvironment.getDefaultProfiles()).to.be.instanceOf(Array);
        expect(localEnvironment.getDefaultProfiles()).to.be.empty;
        expect(stubOnGetProperty.calledWith(localEnvironment.DEFAULT_PROFILES_PROPERTY_KEY)).to.be.true;

        stubOnGetProperty.restore();
    });

    it('should set active profiles', function () {
        // given
        let stubOnGetProperty = stub(localEnvironment, 'getProperty').returns('profile1,profile2');

        // when
        localEnvironment.setActiveProfiles('profile1', 'profile3');

        // then
        expect(localEnvironment.activeProfiles.length).to.be.eql(3);
        expect(localEnvironment.activeProfiles).to.include.members(['profile1', 'profile2', 'profile3']);
        expect(stubOnGetProperty.calledWith(localEnvironment.ACTIVE_PROFILES_PROPERTY_KEY)).to.be.true;

        stubOnGetProperty.restore();
    });

    it('should set application properties', function () {
        // given
        let map = new Map();
        map.set('key', 'val');
        let stubOnGetPropertiesFromPaths = stub(PropertySourceUtil, 'getPropertiesFromPaths').returns(map);
        let stubOnGetProperty = stub(localEnvironment, 'getProperty').returns('profile1,profile2');
        stubOnGetProperty.onCall(0).returns(undefined);
        let stubOnAcceptsProfiles = stub(localEnvironment, 'acceptsProfiles');
        stubOnAcceptsProfiles.withArgs('activeProfile').returns(true);
        stubOnAcceptsProfiles.withArgs('notActiveProfile').returns(false);
        localEnvironment.activeProfiles = ['profile1', 'profile3'];

        // when
        localEnvironment.setApplicationProperties([new ProfiledPath(['activeProfile'], 'somePath'),
            new ProfiledPath(['notActiveProfile'], 'wrongPath')]);

        // then
        expect(localEnvironment.applicationProperties.get('key')).is.eql('val');
        expect(stubOnGetPropertiesFromPaths.calledOnce).to.be.true;
        expect(stubOnGetPropertiesFromPaths.calledWith('somePath')).to.be.true;
        expect(stubOnGetProperty.calledWith(localEnvironment.ACTIVE_PROFILES_PROPERTY_KEY)).to.be.true;
        expect(localEnvironment.activeProfiles.length).to.be.eql(3);
        expect(localEnvironment.activeProfiles).to.include.members(['profile1', 'profile2', 'profile3']);

        stubOnGetPropertiesFromPaths.restore();
    });
});