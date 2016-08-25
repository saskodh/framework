import {expect} from "chai";
import {
    IComponentDefinitionPostProcessor,
    COMPONENT_DEFINITION_POST_PROCESSOR_DECORATOR_TOKEN, ComponentDefinitionPostProcessor,
    ComponentDefinitionPostProcessorUtil
} from "../../../src/lib/processors/CacheDefinitionPostProcessor";
import { ComponentUtil } from "../../../src/lib/decorators/ComponentDecorator";

describe('ComponentDefinitionPostProcessor', function () {

    it('should add metadata', function () {
        // given
        @ComponentDefinitionPostProcessor()
        class A {}

        // when
        let isDefinitionPostProcessor = A[COMPONENT_DEFINITION_POST_PROCESSOR_DECORATOR_TOKEN];

        // then
        expect(isDefinitionPostProcessor).to.be.true;
        expect(ComponentUtil.isComponent(A)).to.be.true;
    });

    it('should return if target implements the IComponentDefinitionPostProcessor interface', function () {
        // given
        @ComponentDefinitionPostProcessor()
        class A implements IComponentDefinitionPostProcessor {
            postProcessDefinition(compConstructor) {
                return undefined;
            }
        }
        let a = new A();

        class B {}
        let b = new B();

        // when
        let isDefinitionPostProcessorA = ComponentDefinitionPostProcessorUtil.isIComponentDefinitionPostProcessor(a);
        let isDefinitionPostProcessorB = ComponentDefinitionPostProcessorUtil.isIComponentDefinitionPostProcessor(b);

        // then
        expect(isDefinitionPostProcessorA).to.be.true;
        expect(isDefinitionPostProcessorB).to.be.false;
    });
});