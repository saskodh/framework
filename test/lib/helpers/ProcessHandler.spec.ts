import {expect} from "chai";
import {stub} from "sinon";
import {ProcessHandler} from "../../../src/lib/helpers/ProcessHandler";
import { GeneralUtils } from "../../../src/lib/helpers/GeneralUtils";

describe('ProcessHandler', function () {

    let processOnMock;

    beforeEach(() => {
        processOnMock = stub(process, 'on');
    });

    afterEach(() => {
        processOnMock.restore();
    });

    it('should return singleton instance on getInstance()', function () {
        // given / when / then
        expect(ProcessHandler.getInstance()).to.be.equal(ProcessHandler.getInstance());
    });

    it('should call registered listeners on process.exit()', function () {
        // given
        let listenerOne = stub();
        let listenerTwo = stub();

        let processHandler = new ProcessHandler();
        let processExitCallback = processOnMock.args[0][1];

        processHandler.registerOnExitListener(listenerOne);
        processHandler.registerOnExitListener(listenerTwo);

        // when
        processExitCallback();

        // then
        expect(processOnMock.args[0][0]).to.be.eql('exit');
        expect(listenerOne.called).to.be.true;
        expect(listenerTwo.called).to.be.true;
    });

    it('should throw error when registering listener which is not a function', function () {
        // given
        let processHandler = new ProcessHandler();

        // when / then
        expect(processHandler.registerOnExitListener.bind(processHandler, 5)).to.throw(Error);
        expect(processHandler.registerOnExitListener.bind(processHandler, {val: 'name'})).to.throw(Error);
        expect(processHandler.registerOnExitListener.bind(processHandler, undefined)).to.throw(Error);
        expect(processHandler.registerOnExitListener.bind(processHandler, true)).to.throw(Error);
        expect(processHandler.registerOnExitListener.bind(processHandler, 'chocolates')).to.throw(Error);
    });

    it('should not call unregistered listeners on process.exit()', function () {
        // given
        let listenerOne = stub();
        let listenerTwo = stub();

        let processHandler = new ProcessHandler();
        let processExitCallback = processOnMock.args[0][1];

        let unRegisterListenerOneCallback = processHandler.registerOnExitListener(listenerOne);
        processHandler.registerOnExitListener(listenerTwo);

        // when
        unRegisterListenerOneCallback();
        processExitCallback();

        // then
        expect(listenerOne.called).to.be.false;
        expect(listenerTwo.called).to.be.true;
    });

    it('should get process properties', function () {
        // given
        let processHandler = new ProcessHandler();
        let stubOnProcessArgv = stub(process.argv, 'forEach', (callback) =>
            ['nodePath', 'entryPath', 'arg1', 'arg2=val'].forEach(callback));

        // when
        let result = processHandler.getProcessProperties();

        // then
        expect(result.size).to.eql(4);
        expect(result.get('application.process.node')).to.eql('nodePath');
        expect(result.get('application.process.entryFile')).to.eql('entryPath');
        expect(result.get('arg1')).to.eql('true');
        expect(result.get('arg2')).to.eql('val');

        stubOnProcessArgv.restore();
    });

    it('should get node properties', function () {
        // given
        let processHandler = new ProcessHandler();
        let stubOnProcessExecArgv = stub(process.execArgv, 'forEach', (callback) =>
            ['arg1', 'arg2=val'].forEach(callback));

        // when
        let result = processHandler.getNodeProperties();

        // then
        expect(result.size).to.eql(2);
        expect(result.get('arg1')).to.eql('true');
        expect(result.get('arg2')).to.eql('val');

        stubOnProcessExecArgv.restore();
    });

    it('should get environment properties', function () {
        // given
        let processHandler = new ProcessHandler();
        let map = new Map();
        map.set('key1', 'val1');
        map.set('key2', 'val2');
        let stubOnFlattenObject = stub(GeneralUtils, 'flattenObject').returns(map);

        // when
        let result = processHandler.getEnvironmentProperties();

        // then
        expect(result).to.equal(map);
        expect(stubOnFlattenObject.calledWith(process.env)).to.be.true;

        stubOnFlattenObject.restore();
    });

    it('should call process.exit() on SIGINT', function () {
        // given
        let processExitSpy = stub(process, 'exit');
        new ProcessHandler();
        let processOnSigint = processOnMock.args[1][1];

        // when
        processOnSigint();

        // then
        expect(processOnMock.args[1][0]).to.be.eql('SIGINT');
        expect(processExitSpy.called).to.be.true;
    });
});