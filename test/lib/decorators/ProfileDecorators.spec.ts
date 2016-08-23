import { expect } from "chai";
import { Configuration, ConfigurationUtil } from "../../../src/lib/decorators/ConfigurationDecorator";
import { Profile, ActiveProfiles } from "../../../src/lib/decorators/ProfileDecorators";
import { ComponentUtil, Component } from "../../../src/lib/decorators/ComponentDecorator";
import { DecoratorUsageError } from "../../../src/lib/errors/DecoratorUsageErrors";

function SomeDecorator(...args) {} // tslint:disable-line

class MyClass {
    myProperty: string;
    @SomeDecorator
    myFunction(str: string) {} // tslint:disable-line
}

describe('ActiveProfilesDecorator', function () {

    it('should add active profiles', function () {
        // given / when
        @ActiveProfiles('profileOne', 'profileTwo')
        @ActiveProfiles('profileThree')
        @Configuration()
        class A { }

        // then
        let profiles = ConfigurationUtil.getConfigurationData(A).activeProfiles;
        expect(profiles.length).to.be.eq(3);
        expect(profiles).to.include.members(['profileOne', 'profileTwo', 'profileThree']);
    });

    it('should throw when not on @Configuration', function () {
        // given / when / then
        expect(ActiveProfiles('somePath').bind(undefined, MyClass)).to.throw(DecoratorUsageError);
        expect(ActiveProfiles('somePath').bind(undefined, MyClass.prototype,
            'myFunction', MyClass.prototype.myFunction)).to.throw(DecoratorUsageError);
        expect(ActiveProfiles('somePath').bind(undefined, MyClass.prototype,
            'myProperty')).to.throw(DecoratorUsageError);
    });
});

describe('ProfileDecorator', function () {

    it('should add profiles', function () {
        // given / when
        @Profile('profileOne', 'profileTwo')
        @Profile('profileThree')
        @Component()
        class A { }

        // then
        let profiles = ComponentUtil.getComponentData(A).profiles;
        expect(profiles.length).to.be.eq(3);
        expect(profiles).to.include.members(['profileOne', 'profileTwo', 'profileThree']);
    });

    it('should throw error when @Profile is used on non Component', function () {
        // given / when / then
        expect(Profile('dev').bind(undefined, MyClass)).to.throw(DecoratorUsageError);
        expect(Profile('dev').bind(undefined, MyClass.prototype, 'myFunction', MyClass.prototype.myFunction))
            .to.throw(DecoratorUsageError);
        expect(Profile('dev').bind(undefined, MyClass.prototype, 'myProperty')).to.throw(DecoratorUsageError);
    });
});