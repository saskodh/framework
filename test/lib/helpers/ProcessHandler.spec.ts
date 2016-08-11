import {expect} from "chai";
import {stub} from "sinon";
import {ProcessHandler} from "../../../src/lib/helpers/ProcessHandler";
import { BadArgumentError } from "../../../src/lib/errors/BadArgumentError";

describe('ProcessHandler', function () {

    let processOnMock;

    beforeEach(() => {
        processOnMock = stub(process, 'on');
    });

    afterEach(() => {
        processOnMock.restore();
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

    it('should throw error when registering listener which is not a function', function () {
        // given
        let processHandler = new ProcessHandler();

        // when / then
        expect(processHandler.registerOnExitListener.bind(processHandler, 5)).to.throw(BadArgumentError);
        expect(processHandler.registerOnExitListener.bind(processHandler, {val: 'name'})).to.throw(BadArgumentError);
        expect(processHandler.registerOnExitListener.bind(processHandler, undefined)).to.throw(BadArgumentError);
        expect(processHandler.registerOnExitListener.bind(processHandler, true)).to.throw(BadArgumentError);
        expect(processHandler.registerOnExitListener.bind(processHandler, 'chocolates')).to.throw(BadArgumentError);
    });

    it('should return singleton instance on getInstance()', function () {
        // given / when / then
        expect(ProcessHandler.getInstance()).to.be.equal(ProcessHandler.getInstance());
    });
});