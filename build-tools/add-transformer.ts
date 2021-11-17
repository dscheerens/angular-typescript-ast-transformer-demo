import { AngularWebpackPlugin } from '@ngtools/webpack';
import { BuilderProgram, CustomTransformers, Program, SourceFile } from 'typescript';
import { Configuration } from 'webpack';

export type CreateTransformers = (program: Program) => Exclude<CustomTransformers['before'], undefined>;

export function addTransformer(webpackConfig: Configuration, createTransformers: CreateTransformers): void {
    const plugins = (webpackConfig.plugins ?? []);
    const angularWebpackPlugin = plugins.find(isInstanceOf(AngularWebpackPlugin)) as AngularWebpackPluginWithPrivateApi | undefined;

    if (!angularWebpackPlugin) {
        return;
    }

    const originalCreateFileEmitterFunction = angularWebpackPlugin.createFileEmitter;

    angularWebpackPlugin.createFileEmitter = function(program, transformers, getExtraDependencies, onAfterEmit) {
        for (const transformer of createTransformers(program.getProgram())) {
            transformers.before?.push(transformer);
        }

        return originalCreateFileEmitterFunction.call(this, program, transformers, getExtraDependencies, onAfterEmit);
    };
}

type AngularWebpackPluginWithPrivateApi = Omit<AngularWebpackPlugin, 'createFileEmitter'> & {
    createFileEmitter(
        program: BuilderProgram,
        transformers: CustomTransformers,
        getExtraDependencies: (sourceFile: SourceFile) => Iterable<string>,
        onAfterEmit?: (sourceFile: SourceFile) => void,
    ): unknown;
};

function isInstanceOf<T>(type: Function & { prototype: T }): (value: unknown) => value is T {
    return (value): value is T => value instanceof type;
}
