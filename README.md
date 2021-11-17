# AST transformers in Angular

This project contains an Angular application to demonstrate how TypeScript AST transformers can be integrated in the compilation pipeline.
While AST transformers are officially not supported in the Angular CLI it can be achieved using a custom builder such as [ngx-build-plus](https://github.com/just-jeb/angular-builders/tree/master/packages/custom-webpack) or [@angular-builders/custom-webpack](https://github.com/just-jeb/angular-builders/tree/master/packages/custom-webpack).
The latter is used in this project.

These custom builders enable access to the [`AngularWebpackPlugin`](https://github.com/angular/angular-cli/blob/13.0.x/packages/ngtools/webpack/src/ivy/plugin.ts).
When a reference to this plugin has been obtained it is possible to insert your own AST transformers.
An example can be found in the [`build-tools/add-transformer.ts`](build-tools/add-transformer.ts) file.

**Note that the implementation is based on Angular 12+ and won't work for older versions!**
This is because the (private) APIs of the `@ngtools/webpack` package have changed since Angular 12.
For older versions of Angular this is still possible, but it requires some adjustments.
