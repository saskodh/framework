import { expect } from "chai";
import { spy, stub } from "sinon";
import * as fileSystem from "fs";
import * as path_module from "path";
import {
    ConfigurationData, Configuration,
    ConfigurationUtil, ProfiledPath
} from "../../../src/lib/decorators/ConfigurationDecorator";
import { ComponentScanUtil, ComponentScan } from "../../../src/lib/decorators/ComponentScanDecorator";
import { RequireUtils } from "../../../src/lib/helpers/RequireUtils";
import { Environment } from "../../../src/lib/di/Environment";

describe('ComponentScanDecorator', function () {

    it('should add metadata', function () {
        // given
        let addComponentScanPathStub = stub(ConfigurationUtil, 'addComponentScanPath');

        // when
        @ComponentScan('somePath')
        @Configuration()
        class A {}

        // then
        expect(addComponentScanPathStub.calledWith(A, 'somePath')).to.be.true;

        addComponentScanPathStub.restore();
    });

    it('should throw when not on @Configuration', function () {
        // given
        class A {}

        // when / then
        expect(ComponentScan('somePath').bind(null, A)).to.throw(Error);
    });
});

describe('ComponentScanUtil', function () {

    class File {
        path: string;

        constructor(path) {
            this.path = path;
        };

        public isFile(): boolean {
            return this.path.includes("File");
        };

        public isDirectory(): boolean {
            return !this.path.includes("File");
        }
    }

    it('should load all components', function () {
        // given
        let environment = new Environment();
        let configData = new ConfigurationData();
        configData.componentScanPaths.push(new ProfiledPath(['activeProfile'], 'pathOne'));
        configData.componentScanPaths.push(new ProfiledPath(['activeProfile'], 'pathTwo'));
        configData.componentScanPaths.push(new ProfiledPath(['inactiveProfile'], 'pathThree'));
        let StubOnLoadComponentsFromPath = stub(ComponentScanUtil, 'loadComponentsFromPath');
        let stubOnAcceptsProfiles = stub(environment, 'acceptsProfiles');
        stubOnAcceptsProfiles.withArgs('activeProfile').returns(true);
        stubOnAcceptsProfiles.withArgs('inactiveProfile').returns(false);

        // when
        ComponentScanUtil.loadAllComponents(configData, environment);

        // then
        expect(StubOnLoadComponentsFromPath.calledTwice).to.be.true;
        expect(StubOnLoadComponentsFromPath.args).to.be.eql([['pathOne', configData], ['pathTwo', configData]]);

        StubOnLoadComponentsFromPath.restore();
        stubOnAcceptsProfiles.restore();
    });

    it('should get modules from path', function () {
        // given
        let stubOnLstatSync = stub(fileSystem, 'lstatSync', (path: string) => new File(path));
        let stubOnReaddirSync = stub(fileSystem, 'readdirSync', (path: string) => {
            return (path === 'somePath') ? ['someDir', 'someFile'] : ['someFile'];
        });
        let stubOnJoin = stub(path_module, 'join', (path: string, name: string) =>  path + '/' + name);
        let stubOnExtname = stub(path_module, 'extname').returns('.js');
        let stubOnRequire = stub(RequireUtils, 'require').returns('someFileContents');
        let spyOnGetModulesStartingFrom = spy(ComponentScanUtil, 'getModulesStartingFrom');
        let spyOnIsFile = spy(File.prototype, 'isFile');
        let spyOnIsDirectory = spy(File.prototype, 'isDirectory');

        let MyComponentScanUtil = <any> ComponentScanUtil;

        // when
        let result = [];
        for (let stuff of MyComponentScanUtil.getModulesStartingFrom('somePath')) {
            result.push(stuff);
        }

        // then
        expect(result).to.eql(['someFileContents', 'someFileContents']);
        expect(stubOnLstatSync.callCount).to.eql(5);
        expect(stubOnLstatSync.args).to.be.eql([['somePath'], ['somePath/someDir'], ['somePath/someDir'],
            ['somePath/someDir/someFile'], ['somePath/someFile']]);
        expect(stubOnReaddirSync.calledTwice).to.be.true;
        expect(stubOnReaddirSync.args).to.be.eql([['somePath'], ['somePath/someDir']]);
        expect(stubOnJoin.calledThrice).to.be.true;
        expect(stubOnJoin.args).to.be.eql([['somePath', 'someDir'], ['somePath/someDir', 'someFile'],
            ['somePath', 'someFile']]);
        expect(stubOnExtname.calledTwice).to.be.true;
        expect(stubOnExtname.args).to.be.eql([['someFile'], ['someFile']]);
        expect(stubOnRequire.calledTwice).to.be.true;
        expect(stubOnRequire.args).to.be.eql([['somePath/someDir/someFile'], ['somePath/someFile']]);
        expect(spyOnGetModulesStartingFrom.calledTwice).to.be.true;
        expect(spyOnGetModulesStartingFrom.args).to.be.eql([['somePath'], ['somePath/someDir']]);
        expect(spyOnIsFile.calledThrice).to.be.true;
        expect(spyOnIsDirectory.callCount).to.eql(5);

        // cleanup
        stubOnLstatSync.restore();
        stubOnReaddirSync.restore();
        stubOnJoin.restore();
        stubOnExtname.restore();
        stubOnRequire.restore();
        spyOnGetModulesStartingFrom.restore();
        spyOnIsFile.restore();
        spyOnIsDirectory.restore();
    });

    it('should throw on getting modules from file', function () {
        // given
        let stubOnLstatSync = stub(fileSystem, 'lstatSync', (path: string) => new File(path));
        let MyComponentScanUtil = <any> ComponentScanUtil;

        // when
        let it = MyComponentScanUtil.getModulesStartingFrom('somePath/someFile');

        // then
        let hasThrown = false;
        try {
            it.next();
        } catch (error) {
            hasThrown = true;
        }
        expect(hasThrown).to.be.true;

        stubOnLstatSync.restore();
    });
});