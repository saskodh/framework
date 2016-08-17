import {expect} from "chai";
import {
    Component
} from "../../../src/lib/decorators/ComponentDecorator";
import {
    PostConstruct, LifeCycleHooksUtil, PreDestroy
} from "../../../src/lib/decorators/LifeCycleHooksDecorators";

describe('PostConstructDecorator', function () {

    it('should add metadata', function () {
        // given
        @Component()
        class A {
            @PostConstruct()
            init () {}
        }

        // when
        let config = LifeCycleHooksUtil.getConfig(A);

        // then
        expect(config.postConstructMethod).to.eql('init');
        expect(config.preDestroyMethod).to.be.undefined;
    });

    it('should throw error if @PostConstruct is used on more than one method', function () {
        // given
        let createComponent = () => {
            @Component()
            class A {
                @PostConstruct()
                init() {}

                @PostConstruct()
                initTwo() {}
            }
        };

        // when / then
        expect(createComponent).to.throw(Error);
    });
});

describe('PreDestroyDecorator', function () {

    it('should add metadata', function () {
        // given
        @Component()
        class A {
            @PreDestroy()
            destroy () {}
        }

        // when
        let config = LifeCycleHooksUtil.getConfig(A);

        // then
        expect(config.preDestroyMethod).to.eql('destroy');
        expect(config.postConstructMethod).to.be.undefined;
    });

    it('should throw error if @PreDestroy is used on more than one method', function () {
        // given
        let createComponent = () => {
            @Component()
            class A {
                @PreDestroy()
                destroy() {}

                @PreDestroy()
                destroy2() {}
            }
        };

        // when / then
        expect(createComponent).to.throw(Error);
    });
});