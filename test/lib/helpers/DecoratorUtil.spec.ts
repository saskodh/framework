import { expect } from "chai";
import { DecoratorUtil, DecoratorType } from "../../../src/lib/helpers/DecoratorUtils";
import * as _ from "lodash";

describe('DecoratorUtil', function () {

    let getAssertingDecoratorFromType = function (decoratorType) {
        return function ClassDecorator(...args) {
            expect(DecoratorUtil.getType(args)).to.be.eq(decoratorType);
            expect(DecoratorUtil.isType(decoratorType, args)).to.be.true;
            for (let type of _.filter(DecoratorType.getAllTypes(), (type) => type !== decoratorType)) {
                expect(DecoratorUtil.isType(type, args)).to.be.false;
            }
        };
    };

    it('should the decorator type correctly (CLASS)', function () {
        // given / when / then
        @getAssertingDecoratorFromType(DecoratorType.CLASS)
        class A {}
    });

    it('should the decorator type correctly (METHOD)', function () {
        // given / when / then
        class A {
            @getAssertingDecoratorFromType(DecoratorType.METHOD)
            method () {}
        }
    });

    it('should the decorator type correctly (PROPERTY)', function () {
        // given / when / then
        class A {
            @getAssertingDecoratorFromType(DecoratorType.PROPERTY)
            private property;
        }
    });

    it('should the decorator type correctly (PARAMETER)', function () {
        // given / when / then
        class A {
            method (@getAssertingDecoratorFromType(DecoratorType.PARAMETER) methodParam) {}
        }
    });
});