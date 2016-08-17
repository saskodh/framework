import { expect } from "chai";
import {
    Component, ComponentUtil
} from "../../../src/lib/decorators/ComponentDecorator";
import {
    Inject, InjectUtil, Value, Autowire
} from "../../../src/lib/decorators/InjectionDecorators";
import "reflect-metadata";
import { Qualifier } from "../../../src/lib/decorators/QualifierDecorator";

describe('InjectDecorator', function () {

    it('should add metadata with class token', function () {
        //given
        let givenToken = Symbol('token');

        @Component()
        class B {}

        @Qualifier(givenToken)
        @Component()
        class C {}

        @Component()
        class A {

            @Inject()
            private b: B;

            @Inject(givenToken)
            private c: Array<C>;
        }

        //when
        let dependenciesA = InjectUtil.getDependencies(A.prototype);

        //then
        expect(dependenciesA.size).to.be.eq(2);
        expect(dependenciesA.get('b').token).to.be.eql(ComponentUtil.getClassToken(B));
        expect(dependenciesA.get('b').isArray).to.be.false;
        expect(dependenciesA.get('c').token).to.be.eql(givenToken);
        expect(dependenciesA.get('c').isArray).to.be.true;
    });

    it('should add metadata with the given token', function () {
        //given
        let givenToken = Symbol('myToken');

        @Component()
        class A {
            @Inject(givenToken)
            private prop;
        }

        //when
        let dependenciesA = InjectUtil.getDependencies(A.prototype);

        //then
        expect(dependenciesA.size).to.be.eq(1);
        expect(dependenciesA.get('prop').token).to.be.eql(givenToken);
        expect(dependenciesA.get('prop').isArray).to.be.false;
    });

    it('extended classes should have the dependency data from the parent classes', function () {
        //given
        let givenToken1 = Symbol('token1');
        let givenToken2 = Symbol('token2');

        class A {
            @Inject(givenToken1)
            private prop1;
        }

        @Component()
        class B extends A {
            @Inject(givenToken2)
            private prop2;
        }

        @Component()
        class C extends B {}

        //when
        let dependenciesB = InjectUtil.getDependencies(B.prototype);
        let dependenciesC = InjectUtil.getDependencies(C.prototype);

        //then
        expect(dependenciesB.size).to.be.eq(2);
        expect(dependenciesB.get('prop1').token).to.be.eql(givenToken1);
        expect(dependenciesB.get('prop1').isArray).to.be.false;
        expect(dependenciesC.size).to.be.eq(2);
        expect(dependenciesC.get('prop1').token).to.be.eql(givenToken1);
        expect(dependenciesC.get('prop1').isArray).to.be.false;
        expect(dependenciesC.get('prop2').token).to.be.eql(givenToken2);
        expect(dependenciesC.get('prop2').isArray).to.be.false;
    });

    it('should throw error if injected property is not a component', function () {
        //given
        class B {}
        let createComponent = () => {

            @Component()
            class A {

                @Inject()
                private b: B;
            }
        };

        //when / then
        expect(createComponent).to.throw(Error);
    });
});

describe('AutowireDecorator', function () {

    it('should add metadata', function () {
        //given
        @Component()
        class B {
        }

        @Component()
        class A {

            @Autowire()
            b1: B;

            @Autowire()
            b2: B;
        }

        //when
        let dependenciesA = InjectUtil.getDependencies(A.prototype);

        //then
        expect(dependenciesA.size).to.be.eq(2);
        expect(dependenciesA.get('b1').token).to.be.eql(ComponentUtil.getClassToken(B));
        expect(dependenciesA.get('b1').isArray).to.be.false;
        expect(dependenciesA.get('b2').token).to.be.eql(ComponentUtil.getClassToken(B));
        expect(dependenciesA.get('b2').isArray).to.be.false;
    });
});

describe('ValueDecorator', function () {

    it('should add metadata', function () {
        //given
        @Component()
        class A {

            @Value('default.name')
            name: string;
        }

        //when
        let propertiesA = InjectUtil.getProperties(A.prototype);

        //then
        expect(propertiesA.size).to.be.eq(1);
        expect(propertiesA.get('name')).to.be.eq('default.name');
    });
});

describe('InjectUtils', function () {

    it('should get dependencies', function () {
        //given
        let givenDependencies = new Map();
        class A {}

        //when
        let injectionDataA = InjectUtil.initIfDoesntExist(A);
        injectionDataA.dependencies = givenDependencies;

        //then
        expect(InjectUtil.getDependencies(A)).to.be.equal(givenDependencies);
    });

    it('should get properties', function () {
        //given
        let givenProperties = new Map();
        class A {}

        //when
        let injectionDataA = InjectUtil.initIfDoesntExist(A);
        injectionDataA.properties = givenProperties;

        //then
        expect(InjectUtil.getProperties(A)).to.be.equal(givenProperties);
    });
});