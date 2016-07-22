import {expect} from "chai";
import {stub} from "sinon";
import {
    ConfigurationData, Configuration,
    ConfigurationUtil
} from "../../../src/lib/decorators/ConfigurationDecorator";
import { ComponentScanUtil, ComponentScan } from "../../../src/lib/decorators/ComponentScanDecorator";

describe('ComponentScanDecorator', function () {

    it('should add metadata', function () {
        // given
        let addComponentScanPathStub = stub(ConfigurationUtil, 'addComponentScanPath');

        // when
        @ComponentScan('somePath')
        @Configuration()
        class A {}

        // then
        expect(addComponentScanPathStub.calledOnce).to.be.true;
        expect(addComponentScanPathStub.args).to.be.eql([[ A, 'somePath']]);

        addComponentScanPathStub.restore();
    });

    it('should throw when not on @Configuration', function () {
        // given
        class A {}

        // when / then
        expect(ComponentScan('somePath').bind(this, A)).to.throw(Error);
    });
});

describe('ComponentScanUtil', function () {

    it('should load all components', function () {
        // given
        let configData = new ConfigurationData();
        configData.componentScanPaths.push('pathOne');
        configData.componentScanPaths.push('pathTwo');
        let loadComponentsFromPathStub = stub(ComponentScanUtil, 'loadComponentsFromPath');
        // when
        ComponentScanUtil.loadAllComponents(configData);

        // then
        expect(loadComponentsFromPathStub.calledTwice).to.be.true;
        expect(loadComponentsFromPathStub.args).to.be.eql([['pathOne', configData], ['pathTwo', configData]]);

        loadComponentsFromPathStub.restore();
    });
});