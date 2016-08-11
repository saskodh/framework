import {expect} from "chai";
import {
    ComponentDefinitionPostProcessor,
    COMPONENT_DEFINITION_POST_PROCESSOR_DECORATOR_TOKEN
} from "../../../src/lib/processors/ComponentDefinitionPostProcessor";
import { ComponentUtil } from "../../../src/lib/decorators/ComponentDecorator";

@ComponentDefinitionPostProcessor()
class A {}

describe('ComponentDefinitionPostProcessor', function () {

    it('should add metadata', function () {
        // given / when
        let isDefinitionPostProcessor = A[COMPONENT_DEFINITION_POST_PROCESSOR_DECORATOR_TOKEN];

        // then
        expect(isDefinitionPostProcessor).to.be.true;
        expect(ComponentUtil.isComponent(A)).to.be.true;
    });
});