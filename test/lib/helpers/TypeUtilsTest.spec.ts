import {expect} from 'chai';
import {TypeUtils} from "../../../src/lib/helpers/TypeUtils";

describe('TypeUtils', function () {
    
    let assertIsA = function (givenType?, comparisonType?) {
        return function () {
            return TypeUtils.isA(givenType, comparisonType);
        }
    };

    class A {
        private a:string = 'a';
    }

    class B extends A {
        private b:string = 'b';
    }

    class C extends B {
        private c:string = 'c';
    }

    it('should throw if the given type is undefined', function () {
        // given / when / then
        expect(assertIsA(undefined, Array)).to.throw(Error);
        expect(assertIsA(Array, undefined)).to.throw(Error);
        expect(assertIsA(undefined, undefined)).to.throw(Error);
    });

    it('should return true if the given type extends the comparison type', function () {
        // given / when / then
        expect(TypeUtils.isA(C, C)).to.be.true;
        expect(TypeUtils.isA(C, B)).to.be.true;
        expect(TypeUtils.isA(C, A)).to.be.true;
        expect(TypeUtils.isA(B, A)).to.be.true;
        expect(TypeUtils.isA(Array, Array)).to.be.true;
        expect(TypeUtils.isA(Array, Object)).to.be.true;
        expect(TypeUtils.isA(function () {}, Object)).to.be.true;
    });

    it('should return false if the given type does not extend the comparison type', function () {
        // given / when / then
        expect(TypeUtils.isA(A, B)).to.be.false;
        expect(TypeUtils.isA(A, C)).to.be.false;
        expect(TypeUtils.isA(B, C)).to.be.false;
        expect(TypeUtils.isA(Object, Array)).to.be.false;
        expect(TypeUtils.isA([1, 2, 3], Array)).to.be.false;
        expect(TypeUtils.isA(function () {}, A)).to.be.false;
        expect(TypeUtils.isA(C, Array)).to.be.false;
    });
});