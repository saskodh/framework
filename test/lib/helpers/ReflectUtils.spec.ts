import {expect} from "chai";
import {ReflectUtils} from "../../../src/lib/helpers/ReflectUtils";

describe('ReflectUtils', function () {

    it('should get all method names', function () {
        // given
        class A {
            methodA() {} // tslint:disable-line
        }
        class B extends A {
            methodB() {} // tslint:disable-line
        }
        class C extends A {
            methodC() {} // tslint:disable-line
        }
        class D extends C {
            methodD() {} // tslint:disable-line
        }

        // when
        let methodNamesD = ReflectUtils.getAllMethodsNames(D);
        let methodNamesB = ReflectUtils.getAllMethodsNames(B);
        console.log(methodNamesB);
        console.log(methodNamesD);

        // then
        expect(methodNamesD.length).to.be.eq(4);
        expect(methodNamesD).to.include.members(['constructor',
            'methodD',
            'methodC',
            'methodA']);
        expect(methodNamesB.length).to.be.eq(3);
        expect(methodNamesB).to.include.members(['constructor',
            'methodB',
            'methodA']);
    });

    it('should not return symbols', function () {
        // given
        class A {
            methodA() {} // tslint:disable-line
        }
        class B extends A {
            methodB() {} // tslint:disable-line
        }
        class C extends A {
            methodC() {} // tslint:disable-line
        }
        class D extends C {
            methodD() {} // tslint:disable-line
        }
        let symbolOne = Symbol('SYMBOL_ONE');
        let symbolTwo = Symbol('SYMBOL_TWO');
        B[symbolOne] = 'value one';
        D[symbolTwo] = 'value two';

        // when
        let methodNamesD = ReflectUtils.getAllMethodsNames(D);
        let methodNamesB = ReflectUtils.getAllMethodsNames(B);

        // then
        expect(methodNamesD.length).to.be.eq(4);
        expect(methodNamesD).to.include.members(['constructor',
            'methodD',
            'methodC',
            'methodA']);
        expect(methodNamesB.length).to.be.eq(3);
        expect(methodNamesB).to.include.members(['constructor',
            'methodB',
            'methodA']);
    });

    it('should get class hierarchy', function () {
        // given
        class A {
            methodA() {} // tslint:disable-line
        }
        class B extends A {
            methodB() {} // tslint:disable-line
        }
        class C extends A {
            methodC() {} // tslint:disable-line
        }
        class D extends C {
            methodD() {} // tslint:disable-line
        }

        // when
        let parentClassesA = ReflectUtils.getClassHierarchy(A);
        let parentClassesB = ReflectUtils.getClassHierarchy(B);
        let parentClassesD = ReflectUtils.getClassHierarchy(D);

        // then
        expect(parentClassesA.length).to.be.eq(1);

        expect(parentClassesB.length).to.be.eq(2);
        expect(parentClassesB[0]).to.be.equal(B);
        expect(parentClassesB[1]).to.be.equal(A);
        expect(parentClassesA[0]).to.be.equal(A);

        expect(parentClassesD.length).to.be.eq(3);
        expect(parentClassesD[0]).to.be.equal(D);
        expect(parentClassesD[1]).to.be.equal(C);
        expect(parentClassesD[2]).to.be.equal(A);
    });
});