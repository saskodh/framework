import {expect} from "chai";
import {Controller} from "../../../src/lib/decorators/ControllerDecorator";
import {
    RequestMethod, RequestMappingUtil, RequestMapping, RouterConfigItem,
} from "../../../src/lib/decorators/RequestMappingDecorator";
import { View } from "../../../src/lib/decorators/ViewDecorator";
import { stub } from "sinon";

describe('RequestMappingDecorator', function () {

    it('should add metadata when used as class decorator', function () {
        // given
        @RequestMapping({path: '/path'})
        @Controller()
        class A {
            method () {}
        }

        // when
        let controllerRoute = RequestMappingUtil.getControllerRequestMappingPath(A);

        // then
        expect(controllerRoute).to.be.eq('/path');
    });

    it('should throw error when @RequestMapping is used on something other than classes and methods', function () {
        // given
        @Controller()
        class A {
            arg1: string;
        }

        // when / then
        expect(RequestMapping({path: '/path', method: RequestMethod.GET}).bind(this, A, 'arg1')).to.throw(Error);
    });

    describe('MethodDecorator', function() {

        it('should throw error when request method parameter is not provided', function () {
            // given
            @Controller()
            class A {
                method () {}
            }

            // when / then
            expect(RequestMapping({path: '/somePath'}).bind(this, A, 'method', A.prototype.method)).to.throw(Error);
        });

        it('should add the route config as metadata', function () {
            // given
            @Controller()
            class A {
                @RequestMapping({path: '/somePath', method: RequestMethod.OPTIONS})
                method () {}

                @RequestMapping({path: '/someOtherPath', method: RequestMethod.DELETE})
                methodTwo () {}
            }

            // when
            let routes = RequestMappingUtil.getValidRoutes(A);
            let route1 = routes.pop();
            let route2 = routes.pop();

            // then
            expect(route1.requestConfig.path).to.be.eq('/someOtherPath');
            expect(route1.requestConfig.method).to.be.eq(RequestMethod.DELETE);
            expect(route1.methodHandler).to.be.eq('methodTwo');
            expect(route1.view).to.be.undefined;

            expect(route2.requestConfig.path).to.be.eq('/somePath');
            expect(route2.requestConfig.method).to.be.eq(RequestMethod.OPTIONS);
            expect(route2.methodHandler).to.be.eq('method');
            expect(route2.view).to.be.undefined;
        });

        it('should set the route config as metadata to the predefined config', function () {
            // given
            @Controller()
            class A {

                @RequestMapping({path: '/somePath', method: RequestMethod.GET})
                @View()
                method () {}
            }

            // when
            let routes = RequestMappingUtil.getValidRoutes(A);
            let route = routes.pop();

            // then
            expect(route.requestConfig.path).to.be.eq('/somePath');
            expect(route.requestConfig.method).to.be.eq(RequestMethod.GET);
            expect(route.methodHandler).to.be.eq('method');
            expect(route.view).to.be.eq('method');
        });
    });
});

describe('RequestMappingUtil', function() {

    it('should return valid routes', function () {
        // given
        let givenTarget = { prototype: 'prototype' };
        let validRoute = new RouterConfigItem({ path: 'path' }, 'methodName');
        let invalidRoute = new RouterConfigItem(null, 'methodName');
        let givenRoutes = [validRoute, invalidRoute];
        let targetStub = stub(RequestMappingUtil, 'initRouterConfigIfDoesntExist').returns({ routes: givenRoutes });

        // when
        let routes = RequestMappingUtil.getValidRoutes(givenTarget);

        // then
        expect(routes).to.include.members([validRoute]);
        expect(routes).to.not.include.members([invalidRoute]);
        expect(targetStub.calledWith(givenTarget.prototype)).to.be.true;
        targetStub.restore();
    });

    it('should return empty string when @RequestMapping is not used on controller', function () {
        // given
        @Controller()
        class A {
        }

        // when
        let controllerRoute = RequestMappingUtil.getControllerRequestMappingPath(A);

        // then
        expect(controllerRoute).to.be.eq('');
    });
});