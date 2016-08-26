import {expect} from "chai";
import {Injector} from "../../../src/lib/di/Injector";
import { InjectionError } from "../../../src/lib/errors/InjectionError";

describe('Injector', function () {

    let injector;
    let token;

    beforeEach(() => {
        injector = new Injector();
        token = Symbol('token');
    });

    it('should register component under given token', function () {
        // given
        let object1 = new Object('name1');

        // when
        injector.register(token, object1);

        // then
        expect(injector.getComponent(token)).to.be.equal(object1);
    });

    it('should throw error when getting an unexisting component', function () {
        // given / when / then
        expect(injector.getComponent.bind(injector, token)).to.throw(InjectionError);
    });

    it('should throw error when getting component with token associated with more than one component', function () {
        // given / when
        injector.register(token, new Object('name1'));
        injector.register(token, new Object('name2'));

        // then
        expect(injector.getComponent.bind(injector, token)).to.throw(InjectionError);
    });

    it('should return registered components under the given token', function () {
        // given
        let object1 = new Object('name1');
        let object2 = new Object('name2');
        let object3 = new Object('name3');

        // when
        injector.register(token, object1);
        injector.register(token, object2);
        injector.register(Symbol('token3'), object3);

        // then
        expect(injector.getComponents(token)).to.include.members([object1, object2]);
        expect(injector.getComponents(token)).to.not.include.members([object3]);
        expect(injector.getComponents(Symbol('unknown_token'))).to.be.empty;
    });
});