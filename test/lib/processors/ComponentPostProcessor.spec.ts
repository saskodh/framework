import {expect} from "chai";
import {
    IComponentPostProcessor,
    COMPONENT_POST_PROCESSOR_DECORATOR_TOKEN, ComponentPostProcessor, ComponentPostProcessorUtil
} from "../../../src/lib/processors/ComponentPostProcessor";
import { ComponentUtil } from "../../../src/lib/decorators/ComponentDecorator";

@ComponentPostProcessor()
class A {}

describe('ComponentPostProcessor', function () {

    it('should add metadata', function () {
        // given / when
        let isPostProcessor = A[COMPONENT_POST_PROCESSOR_DECORATOR_TOKEN];

        // then
        expect(isPostProcessor).to.be.true;
        expect(ComponentUtil.isComponent(A)).to.be.true;
    });

    it('should return if target implements the IComponentPostProcessor interface', function () {
        // given
        @ComponentPostProcessor()
        class A implements IComponentPostProcessor {
            postProcessBeforeInit(compConstructor) {
                return undefined;
            }
            postProcessAfterInit(compConstructor) {
                return undefined;
            }
        }
        let a = new A();

        class B {}
        let b = new B();

        // when
        let isPostProcessorA = ComponentPostProcessorUtil.isIComponentPostProcessor(a);
        let isPostProcessorB = ComponentPostProcessorUtil.isIComponentPostProcessor(b);

        // then
        expect(isPostProcessorA).to.be.true;
        expect(isPostProcessorB).to.be.false;
    });
});