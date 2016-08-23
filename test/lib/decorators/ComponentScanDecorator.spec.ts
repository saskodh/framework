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
import { ComponentUtil } from "../../../src/lib/decorators/ComponentDecorator";
import { Environment } from "../../../src/lib/di/Environment";
import { DecoratorUsageError } from "../../../src/lib/errors/DecoratorUsageErrors";

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
        function SomeDecorator(...args) {} // tslint:disable-line

        class MyClass {
            myProperty: string;
            @SomeDecorator
            myFunction(str: string) {} // tslint:disable-line
        }

        // when / then
        expect(ComponentScan('somePath').bind(undefined, MyClass)).to.throw(DecoratorUsageError);
        expect(ComponentScan('somePath').bind(undefined, MyClass.prototype, 'myFunction', MyClass.prototype.myFunction))
            .to.throw(DecoratorUsageError);
        expect(ComponentScan('somePath').bind(undefined, MyClass.prototype, 'myProperty'))
            .to.throw(DecoratorUsageError);
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

    it('should get all components', function () {
        // given
        let environment = new Environment();
        let configData = new ConfigurationData();
        configData.componentScanPaths.push(new ProfiledPath(['activeProfile'], 'pathOne'));
        configData.componentScanPaths.push(new ProfiledPath(['activeProfile'], 'pathTwo'));
        configData.componentScanPaths.push(new ProfiledPath([], 'pathThree'));
        configData.componentScanPaths.push(new ProfiledPath(['inactiveProfile'], 'pathFour'));
        let module1 = 'module1';
        let module2 = 'module2';
        let module3 = 'module3';
        let component1 = 'component1';
        let component2 = 'component2';
        let component3 = 'component3';
        let stubOnGetModulesStartingFrom = stub(ComponentScanUtil, 'getModulesStartingFrom');
        stubOnGetModulesStartingFrom.withArgs('pathOne').returns([module1]);
        stubOnGetModulesStartingFrom.withArgs('pathTwo').returns([module2]);
        stubOnGetModulesStartingFrom.withArgs('pathThree').returns([module3]);
        let stubOnGetComponentsFromModule = stub(ComponentScanUtil, 'getComponentsFromModule');
        stubOnGetComponentsFromModule.withArgs(module1).returns([component1, component2]);
        stubOnGetComponentsFromModule.withArgs(module2).returns([component3]);
        stubOnGetComponentsFromModule.withArgs(module3).returns([component3]);
        let stubOnEnvironmentAcceptsProfiles = stub(environment, 'acceptsProfiles');
        stubOnEnvironmentAcceptsProfiles.withArgs('activeProfile').returns(true);
        stubOnEnvironmentAcceptsProfiles.withArgs('inactiveProfile').returns(false);

        // when
        let components = ComponentScanUtil.getComponentsFromPaths(configData.componentScanPaths, environment);

        // then
        expect(stubOnGetModulesStartingFrom.calledWith('pathOne')).to.be.true;
        expect(stubOnGetModulesStartingFrom.calledWith('pathTwo')).to.be.true;
        expect(stubOnGetModulesStartingFrom.calledWith('pathThree')).to.be.true;
        expect(stubOnGetComponentsFromModule.calledWith(module1)).to.be.true;
        expect(stubOnGetComponentsFromModule.calledWith(module2)).to.be.true;
        expect(stubOnGetComponentsFromModule.calledWith(module3)).to.be.true;
        expect(components.size).to.be.eq(3);
        expect(components.has(component1)).to.be.true;
        expect(components.has(component2)).to.be.true;
        expect(components.has(component3)).to.be.true;
        expect(stubOnEnvironmentAcceptsProfiles.callCount).to.be.eq(3);
        expect(stubOnEnvironmentAcceptsProfiles.calledWith('activeProfile')).to.be.true;
        expect(stubOnEnvironmentAcceptsProfiles.calledWith('inactiveProfile')).to.be.true;

        // cleanup
        stubOnGetModulesStartingFrom.restore();
        stubOnGetComponentsFromModule.restore();
        stubOnEnvironmentAcceptsProfiles.restore();
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

    it('should get components from module', function () {
        // given
        let MyComponentScanUtil = <any> ComponentScanUtil;
        let module = ['component1', 'notComponent', 'component3'];
        let stubOnComponentUtilIsComponent = stub(ComponentUtil, 'isComponent');
        stubOnComponentUtilIsComponent.withArgs('component1').returns(true);
        stubOnComponentUtilIsComponent.withArgs('notComponent').returns(false);
        stubOnComponentUtilIsComponent.withArgs('component3').returns(true);

        // when
        let componentsFromModule = MyComponentScanUtil.getComponentsFromModule(module);

        // then
        expect(componentsFromModule.length).to.be.eq(2);
        expect(componentsFromModule).to.include.members(['component1', 'component3']);

        // cleanup
        stubOnComponentUtilIsComponent.restore();
    });
});