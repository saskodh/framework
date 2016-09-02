export class ComponentFactory {

    components: Array<any>;

    constructor() {
        this.components = [];
    }

    mergeComponentFactory(componentFactory: ComponentFactory) {
        this.components = this.components.concat(componentFactory.components);
    }
}