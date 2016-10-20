import { DecoratorUtil, DecoratorType } from "../helpers/DecoratorUtils";
import {DecoratorHelper} from "./common/DecoratorHelper";
import {StandaloneDecoratorMetadata} from "./common/DecoratorMetadata";

export class ViewData {
    viewName: string;
    methodName: string;

    constructor(viewName, methodName) {
        this.viewName = viewName;
        this.methodName = methodName;
    }
}
export class ViewDecoratorMetadata extends StandaloneDecoratorMetadata<ViewDecoratorMetadata> {
    methodViews: Array<ViewData> ;

    constructor() {
        super();
        this.methodViews = [];
    }
}
export function View(name?: string) {
    return function (target, methodName) {
        DecoratorUtil.throwOnWrongType(View, DecoratorType.METHOD, [...arguments]);
        let viewName = name || methodName;
        let viewDecoratorMetadata = DecoratorHelper.getOwnMetadata(target, View,
            new ViewDecoratorMetadata());
        let viewData: ViewData = new ViewData(viewName, methodName);
        viewDecoratorMetadata.methodViews.push(viewData);
        DecoratorHelper.setMetadata(target, View, viewDecoratorMetadata);
    };
}
DecoratorHelper.createDecorator(View, DecoratorType.METHOD);