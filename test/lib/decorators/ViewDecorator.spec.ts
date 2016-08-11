import {expect} from "chai";
import {Controller} from "../../../src/lib/decorators/ControllerDecorator";
import {
    RequestMethod, RequestMappingUtil, RequestMapping
} from "../../../src/lib/decorators/RequestMappingDecorator";
import {View} from "../../../src/lib/decorators/ViewDecorator";
import { DecoratorUsageError } from "../../../src/lib/errors/DecoratorUsageError";
require('reflect-metadata');

describe('ViewDecorator', function () {

    it('should add the view name in the router config', function () {
        // given
        @Controller()
        class A {

            @RequestMapping({path: '/path1', method: RequestMethod.OPTIONS})
            method () {} // tslint:disable-line

            @View()
            @RequestMapping({path: '/path2', method: RequestMethod.DELETE})
            methodTwo () {} // tslint:disable-line

            @View('someView')
            @RequestMapping({path: '/path3', method: RequestMethod.PUT})
            methodThree () {} // tslint:disable-line
        }

        // when
        let routes = RequestMappingUtil.getValidRoutes(A);
        let route1 = routes.pop();
        let route2 = routes.pop();
        let route3 = routes.pop();

        // then
        expect(route1.methodHandler).to.be.eq('methodThree');
        expect(route1.view).to.be.eq('someView');

        expect(route2.methodHandler).to.be.eq('methodTwo');
        expect(route2.view).to.be.eq('methodTwo');

        expect(route3.methodHandler).to.be.eq('method');
        expect(route3.view).to.be.undefined;
    });

    it('should work if put below @RequestMapping', function () {
        // given
        @Controller()
        class A {

            @RequestMapping({path: '/path', method: RequestMethod.PATCH})
            @View('someOtherView')
            method () {} // tslint:disable-line
        }

        // when
        let routes = RequestMappingUtil.getValidRoutes(A);
        let route1 = routes.pop();

        // then
        expect(route1.view).to.be.eq('someOtherView');
    });

    it('should throw when not on method', function () {
        // given
        class MyClass {
            myProperty: string;
            myFunction() {} // tslint:disable-line
        }

        // when / then
        expect(View().bind(undefined, MyClass)).to.throw(DecoratorUsageError);
        expect(View().bind(undefined, MyClass, 'myProperty')).to.throw(DecoratorUsageError);
    });
});