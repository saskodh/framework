import {expect} from "chai";
import {ReflectUtils} from "../../../src/lib/helpers/ReflectUtils";

describe('ReflectUtils', function () {

    it('should get all method names', function () {
        // given
        class A {
            methodA(){}
        }
        class B extends A {
            methodB(){}
        }
        class C extends A {
            methodC(){}
        }
        class D extends C {
            methodD(){}
        }

        // when
        // TODO: ReflectUtils.getAllMethodsNames should not return duplicate entries
        let methodNamesD = ReflectUtils.getAllMethodsNames(D);
        let methodNamesB = ReflectUtils.getAllMethodsNames(B);

        // then
        expect(methodNamesD.length).to.be.eq(6);
        expect(methodNamesD).to.include.members(['constructor',
            'methodD',
            'constructor',
            'methodC',
            'constructor',
            'methodA']);
        expect(methodNamesB.length).to.be.eq(4);
        expect(methodNamesB).to.include.members(['constructor',
            'methodB',
            'constructor',
            'methodA']);
    });

    it('should get class hierarchy', function () {
        // given
        class A {
            methodA(){}
        }
        class B extends A {
            methodB(){}
        }
        class C extends A {
            methodC(){}
        }
        class D extends C {
            methodD(){}
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