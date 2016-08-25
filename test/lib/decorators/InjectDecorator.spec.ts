import { expect } from "chai";
import { stub } from "sinon";
import {
    Component, ComponentUtil
} from "../../../src/lib/decorators/ComponentDecorator";
import {
    Inject, InjectUtil, Value, Autowired, DynamicInject, InjectionData, ThreadLocal
} from "../../../src/lib/decorators/InjectionDecorators";
import { Qualifier } from "../../../src/lib/decorators/QualifierDecorator";
import { InjectionError } from "../../../src/lib/errors/InjectionError";
import { DecoratorUsageError } from "../../../src/lib/errors/DecoratorUsageErrors";

function SomeDecorator(...args) {} // tslint:disable-line

class MyClass {
    myProperty: string;
    @SomeDecorator
    myFunction(str: string) {} // tslint:disable-line
}

describe('InjectDecorator', function () {

    it('should add metadata with class token', function () {
        // given
        let givenToken = Symbol('token');

        @Component()
        class B {}

        @Qualifier(givenToken)
        @Component()
        class C {}

        @Component()
        class A {

            @Inject()
            private b: B; // tslint:disable-line

            @Inject(givenToken)
            private c: Array<C>; // tslint:disable-line
        }

        // when
        let dependenciesA = InjectUtil.getDependencies(A.prototype);

        // then
        expect(dependenciesA.size).to.be.eq(2);
        expect(dependenciesA.get('b').token).to.be.eql(ComponentUtil.getClassToken(B));
        expect(dependenciesA.get('b').isArray).to.be.false;
        expect(dependenciesA.get('c').token).to.be.eql(givenToken);
        expect(dependenciesA.get('c').isArray).to.be.true;
    });

    it('should add metadata with the given token', function () {
        // given
        let givenToken = Symbol('myToken');

        @Component()
        class A {
            @Inject(givenToken)
            private prop; // tslint:disable-line
        }

        // when
        let dependenciesA = InjectUtil.getDependencies(A.prototype);

        // then
        expect(dependenciesA.size).to.be.eq(1);
        expect(dependenciesA.get('prop').token).to.be.eql(givenToken);
        expect(dependenciesA.get('prop').isArray).to.be.false;
    });

    it('extended classes should have the dependency data from the parent classes', function () {
        // given
        let givenToken1 = Symbol('token1');
        let givenToken2 = Symbol('token2');

        class A {
            @Inject(givenToken1)
            private prop1; // tslint:disable-line
        }

        @Component()
        class B extends A {
            @Inject(givenToken2)
            private prop2; // tslint:disable-line
        }

        @Component()
        class C extends B {}

        // when
        let dependenciesB = InjectUtil.getDependencies(B.prototype);
        let dependenciesC = InjectUtil.getDependencies(C.prototype);

        // then
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
        // given
        class B {}
        let createComponent = () => {

            @Component()
            class A {

                @Inject()
                private b: B; // tslint:disable-line
            }
        };

        // when / then
        expect(createComponent).to.throw(InjectionError);
    });

    it('should throw error when used on non property', function () {
        // given / when / then
        expect(Inject().bind(undefined, MyClass)).to.throw(DecoratorUsageError);
        expect(Inject().bind(undefined, MyClass.prototype, 'myFunction', MyClass.prototype.myFunction))
            .to.throw(DecoratorUsageError);
    });
});

describe('AutowiredDecorator', function () {

    it('should add metadata', function () {
        // given
        @Component()
        class B {
        }

        @Component()
        class A {

            @Autowired()
            b1: B;

            @Autowired()
            b2: B;
        }

        // when
        let dependenciesA = InjectUtil.getDependencies(A.prototype);

        // then
        expect(dependenciesA.size).to.be.eq(2);
        expect(dependenciesA.get('b1').token).to.be.eql(ComponentUtil.getClassToken(B));
        expect(dependenciesA.get('b1').isArray).to.be.false;
        expect(dependenciesA.get('b2').token).to.be.eql(ComponentUtil.getClassToken(B));
        expect(dependenciesA.get('b2').isArray).to.be.false;
    });

    it('should throw error when used on non property', function () {
        // given / when / then
        expect(Autowired().bind(undefined, MyClass)).to.throw(DecoratorUsageError);
        expect(Autowired().bind(undefined, MyClass.prototype, 'myFunction', MyClass.prototype.myFunction))
            .to.throw(DecoratorUsageError);
    });
});

describe('ValueDecorator', function () {

    it('should add metadata', function () {
        // given
        @Component()
        class A {

            @Value('default.name')
            name: string;
        }

        // when
        let propertiesA = InjectUtil.getProperties(A.prototype);

        // then
        expect(propertiesA.size).to.be.eq(1);
        expect(propertiesA.get('name')).to.be.eq('default.name');
    });

    it('should throw error when used on non property', function () {
        // given / when / then
        expect(Value('someKey').bind(undefined, MyClass)).to.throw(DecoratorUsageError);
        expect(Value('someKey').bind(undefined, MyClass.prototype, 'myFunction', MyClass.prototype.myFunction))
            .to.throw(DecoratorUsageError);
    });
});

describe('DynamicInjectDecorator', function () {

    it('should add metadata', function () {
        // given
        let givenToken = Symbol('given_token');
        let givenInjectionData = new InjectionData();
        let stubOnGetInjectionData = stub(InjectUtil, 'initIfDoesntExist').returns(givenInjectionData);
        let stubOnCreateDependencyData = stub(InjectUtil, 'createDependencyData').returns('dependency-data');

        class GivenDependency { }

        // when
        @Component()
        class A {

            @DynamicInject(givenToken)
            dependency: GivenDependency;
        }

        // then
        expect(givenInjectionData.dynamicDependencies.size).to.be.eq(1);
        expect(givenInjectionData.dynamicDependencies.get('dependency')).to.be.eq('dependency-data');
        expect(stubOnGetInjectionData.calledWith(A.prototype)).to.be.eql(true);
        expect(stubOnCreateDependencyData.calledWith(givenToken, GivenDependency)).to.be.eql(true);

        // clean-up
        stubOnGetInjectionData.restore();
        stubOnCreateDependencyData.restore();
    });
});

describe('ThreadLocalDecorator', function () {

    it('should add metadata', function () {
        // given
        let givenInjectionData = new InjectionData();
        let stubOnGetInjectionData = stub(InjectUtil, 'initIfDoesntExist').returns(givenInjectionData);

        // when
        @Component()
        class A {

            @ThreadLocal()
            dependency: string;
        }

        // then
        expect(givenInjectionData.dynamicDependencies.size).to.be.eq(1);
        expect(givenInjectionData.dynamicDependencies.get('dependency').isArray).to.be.eq(false);
        expect(stubOnGetInjectionData.calledWith(A.prototype)).to.be.eql(true);

        // clean-up
        stubOnGetInjectionData.restore();
    });
});

describe('InjectUtils', function () {

    it('should get dependencies', function () {
        // given
        let givenDependencies = new Map();
        class A {}

        // when
        let injectionDataA = InjectUtil.initIfDoesntExist(A);
        injectionDataA.dependencies = givenDependencies;

        // then
        expect(InjectUtil.getDependencies(A)).to.be.equal(givenDependencies);
    });

    it('should get properties', function () {
        // given
        let givenProperties = new Map();
        class A {}

        // when
        let injectionDataA = InjectUtil.initIfDoesntExist(A);
        injectionDataA.properties = givenProperties;

        // then
        expect(InjectUtil.getProperties(A)).to.be.equal(givenProperties);
    });
});