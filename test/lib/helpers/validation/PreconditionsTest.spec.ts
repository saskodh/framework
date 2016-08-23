import * as _ from "lodash";
import {expect} from 'chai';
import {Preconditions} from "../../../../src/lib/helpers/validation/Preconditions";
import { BadArgumentError } from "../../../../src/lib/errors/BadArgumentErrors";

describe('Preconditions', function () {

    let assertDefinedPrecondition = function (argument?) {
        return function () {
            Preconditions.assertDefined(argument);
        };
    };

    class MyClass {
        value: string;
    }

    it('should throw if argument is undefined', function () {
        // given
        let arg;

        // when / then
        expect(assertDefinedPrecondition(arg)).to.throw(BadArgumentError);
        expect(assertDefinedPrecondition()).to.throw(BadArgumentError);
    });

    it('should not throw if argument is defined', function () {
        // given / when / then
        expect(assertDefinedPrecondition({})).to.not.throw(Error);
        expect(assertDefinedPrecondition(new MyClass())).to.not.throw(Error);
        expect(assertDefinedPrecondition(5)).to.not.throw(Error);
        expect(assertDefinedPrecondition(0)).to.not.throw(Error);
        expect(assertDefinedPrecondition('string')).to.not.throw(Error);
        expect(assertDefinedPrecondition('')).to.not.throw(Error);
        expect(assertDefinedPrecondition(true)).to.not.throw(Error);
        expect(assertDefinedPrecondition(false)).to.not.throw(Error);
        expect(assertDefinedPrecondition([1, 2, 3])).to.not.throw(Error);
        expect(assertDefinedPrecondition([])).to.not.throw(Error);
        expect(assertDefinedPrecondition(Object)).to.not.throw(Error);
        expect(assertDefinedPrecondition(Array)).to.not.throw(Error);
        expect(assertDefinedPrecondition(MyClass)).to.not.throw(Error);
    });

    it('should not modify the passed argument', function () {
        // given
        let argument = { a: 'a', b: 'b' };
        let expectedArgument = _.cloneDeep(argument);

        // when
        Preconditions.assertDefined(argument);

        // then
        expect(argument).to.eql(expectedArgument);
    });
});