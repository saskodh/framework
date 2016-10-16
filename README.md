[![Build Status](https://travis-ci.org/saskodh/framework.svg?branch=master)](https://travis-ci.org/saskodh/framework)
[![Coverage Status](https://coveralls.io/repos/github/saskodh/framework/badge.svg?branch=master)](https://coveralls.io/github/saskodh/framework?branch=master)
[![Join the chat at https://gitter.im/saskodh/framework](https://badges.gitter.im/saskodh/framework.svg)](https://gitter.im/saskodh/framework?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

'Framework' is a new lightweight web framework for NodeJS inspired by [Spring](https://spring.io/). It provides features like IoC (Inversion of control), declarative programming with decorators (a.k.a. Annotations from Java), AOP (Aspect oriented programming), synchronous looking control flow (with async-await or generators) and many more which simplifies the development time and makes your projects maintainable. Developers familiar with Java/Spring web programming will have easy time using 'Framework'. Being built on top of [Express.js](https://expressjs.com/) with [TypeScript](https://www.typescriptlang.org/) enables also developers familiar with [Express.js](https://expressjs.com/) or similar web frameworks to easily start using it. Let's try it now and see all this in action!

## [Getting started](#getting-started)

Assuming that you already installed [Node.js](https://nodejs.org/en/) (^6.x.x) create a directory to hold your application, and make that your working directory.
```bash
$ mkdir framework-demo
$ cd framework-demo
```
Use the npm init command to create a package.json file for your application. For more information on how package.json works, see [Specifics of npm’s package.json handling](https://docs.npmjs.com/files/package.json).
```bash
$ npm init
```
Now when your npm project is ready let's add some dependencies. First of all we will install and configure the TypeScript compiler. [TypeScript](http://www.typescriptlang.org/) is a typed superset of the EcmaScript specification that compiles to plain JavaScript and provides us with really cool features. Make sure that you check their [documentation](http://www.typescriptlang.org/docs/tutorial.html) and get familiar with it. 
```bash
$ npm install typescript --save-dev
```
The TypeScript compiler requires a configuration for compiling the source files. The configuration is provided in a tsconfig.json file which will be placed in the project root directory. Here is a sample tsconfig.json file which we will use in our demo project.
```javascript
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "es6",
    "sourceMap": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "exclude": ["node_modules"]
}
```
Important things to note here is that we will compile down to ES6 and use CommonJS modules. The 'framework' depends on decorators heavily and therefore we enable them. Check the tsconfig.json [documentation](http://www.typescriptlang.org/docs/handbook/tsconfig-json.html) for more info on other available options.

As previously mentioned, the 'framework' is a lightweight framework built on top of the Express.js, so let's start first with a simple express app and see how we easily we can integrate in later.
Install express and body-parser by running the following commands. Note that when working with TypeScript we also need the definition files for these packages.
```bash
$ npm install express body-parser ejs --save
$ npm install @types/express @types/body-parser --save
```
After the successful installation we will create a WebAppInitializer.ts class which we will place it in /src/app directory. This class has only one public static method which will create, configure and start our Express app.
```javascript
import * as path from "path";
import * as bodyParser from "body-parser";
import * as express from "express";
import { Application } from "express-serve-static-core";
import { Request } from "express-serve-static-core";
import { Response } from "express-serve-static-core";

export class WebAppInitializer {

    public static PORT: number = 3000;

    public static async bootstrap():Promise<Application> {
        return await this.start(this.configure(this.create()));
    }

    private static async start(app: Application):Promise<Application> {
        return new Promise<Application> ((resolve) => app.listen(this.PORT, () => resolve(app)));
    }

    private static create() {
        return express();
    }

    private static configure(app: Application):Application {
        // add json form parser
        app.use(bodyParser.json());

        // add query string parser
        app.use(bodyParser.urlencoded({extended: true}));

        // configure view engine
        app.set('views', path.join(__dirname, '../views'));
        app.set('view engine', 'ejs');

        // configure static paths
        app.use(express.static(path.join(__dirname, "public")));

        // configure routes
        this.configureRoutes(app);

        return app;
    }

    private static configureRoutes(app: Application) {
        app.get('/', function (request: Request, response: Response) {
           response.status(200);
           response.write('Hello world!');
           response.end();
        });
    }
}
```
We need to create also an entry file (main.ts) which we will run in order to start our app. Place this file in /app directory.
```javascript
import {WebAppInitializer} from "./app/WebAppInitializer";

var startApp = async function () {
    var app = await WebAppInitializer.bootstrap();
    console.log(`Application up and running on port: ${WebAppInitializer.PORT}`);
};
startApp();
```
This the entry file which we are going to run with Node next, but before that we need to compile our source files into plain JavaScript. Lets add an npm script which will do that for us.
```javascript
{
  "name": "framework-demo",
  "version": "1.0.0",
  ...
  "scripts": {
    ...
    "start": "tsc && node ./src/main.js",
    ...
  },
  ...
}
```
Now run the app from the console with the following command and open [http://localhost:3000/](http://localhost:3000/) to see your message of the day. :)
```bash
$ npm run start
```
Our simple app is up and running now and we are happy to see that. So now let's see how we can integrate the 'framework' into the our existing app and start exploiting it.
To install the framework run the following command. Note that we don't need TypeScript definition files now. That because the 'framework' is written purely in TypeScript and the package comes bundled with the definitions files.
```
$ npm install @sklechko/framework --save
```
Now when the 'framework' is installed let's build our first controller and place it in /app/controllers directory.
```javascript
import { Controller, RequestMapping, RequestMethod } from "@sklechko/framework";

@Controller()
export class GreetingController {

    @RequestMapping({ path: '/hi', method: RequestMethod.GET })
    public async greet() {
        return 'Hi there!';
    }
}
```
The controller is a plain TypeScript class which is decorated with the @Controller decorator. This class can now define methods which can be responsible for handling incoming requests. To declare a request handler method decorate it with the @RequestMapping decorator and specify the path and the HTTP method. Note that the request handler method is an async function where we can write synchronous looking code with the await keyword. The value which we return out of this method will be sent as JSON on the client or passed as view model if we decided to map a view to this path with the @View decorator.
So now when we have the controller ready let's give him some work. This controller now needs to get picked up by the framework and register it's route handler.
The 'framework''s root class is the ApplicationContext. The application context has the dependency injection (DI) container (injector) which gets created and initialized when the ApplicationContext#start method is called on the newly created app context. The app context also exposes a configured [Express router](http://expressjs.com/en/4x/api.html#router) which can be hooked in the previously created Express app to integrate the 'framework' in.
When creating an instance of an ApplicationContext a configuration needs to be passed which will be used to configure and provide the components in the DI container (injector). This configuration is a class which is decorated with the @Configuration decorator. 
For providing the components in the injector we use a concept known as component scanning. Although this concept is very familiar and used in the Java/Spring world, in JavaScript it's quite new. In order to pick up all the components starting from a specific path we just decorate a @Configuration class with @ComponentScan('path') decorator. This will recursively traverse the given path and find all the components (classes decorated with @Component) which can later be registered in the injector.
So let's create our configuration class and place it in the /app directory.
```javascript
import { Configuration, ComponentScan } from "@sklechko/framework";

@ComponentScan(__dirname + '/controllers')
@Configuration()
export class AppConfig {}
```
Now let's adapt the WebAppInitializer in order to integrate the framework. We will add additional 'bootstrapWithContext' method which will take app context and integrate it's router in the Express app.
```javascript
...
import { ApplicationContext } from "@sklechko/framework";
...
public static async bootstrapWithContext(appContext: ApplicationContext) {
    var app = this.configure(this.create());
    app.use(appContext.getRouter());
    return this.start(app);
}
...
```
And finally we need to modify the main.ts file.
```javascript
import { WebAppInitializer } from "./app/WebAppInitializer";
import { AppConfig } from "./app/AppConfig";
import { ApplicationContext } from "@sklechko/framework";

var startApp = async function () {
    let applicationContext = await new ApplicationContext(AppConfig).start();
    var app = await WebAppInitializer.bootstrapWithContext(applicationContext);
    console.log(`Application up and running on port: ${WebAppInitializer.PORT}`);
};
startApp();
```
Now let's restart the app and see our new route in action.
Note that the our controller is not decorated with @Component but still gets picked up by the component scan. This is because @Controller is a stereotype decorator for the @Component decorator and makes the controller a privileged component (can have route handlers in it).

In case you want to see the source files of this simple guide visit the [framework-showcase](https://github.com/saskodh/framework-showcase) project where you can also find examples for the most of the features that we provide.
The 'framework' is still in development and many of the features are in proof-of-concept mode. 

Many thanks to [Dragan Andonovski](https://github.com/draganAndonovski) and [Damjan Angelovski](https://github.com/damjangelovski) for spending two months of their internship working on this idea and Netcetera, Skopje for the support.

## [License](#license)
MIT
