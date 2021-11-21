import {
    CallExpression, Node, NodeFactory, Program, SourceFile, TransformationContext, Transformer, VisitResult, isCallExpression, isIdentifier,
    visitEachChild, visitNode,
} from 'typescript';

import { CreateTransformers } from '../add-transformer';

import { TypeAnalyzer } from './type-analyzer';
import { GeneratedTypeGuardEntry, TypeGuardGenerator } from './type-guard-function-generator';
import { TypeNameGenerator } from './type-name-generator';

export function typeGuardGenerator(): CreateTransformers {
    return (program) => [(context) => typeGuardGeneratorTransformer(
        program,
        new TypeAnalyzer(program.getTypeChecker()),
        context,
    )];
}

function typeGuardGeneratorTransformer(
    program: Program,
    typeAnalyzer: TypeAnalyzer,
    context: TransformationContext,
): Transformer<SourceFile> {
    return (sourceFile) => {
        const typeChecker = program.getTypeChecker();
        const factory = context.factory;
        const generator = new TypeGuardGenerator(
            program,
            context,
            typeAnalyzer,
            new TypeNameGenerator(typeChecker, typeAnalyzer),
        );

        function visit(node: Node): VisitResult<Node> {
            if (isTypeGuard(node)) {
                const typeToCheck = typeChecker.getTypeFromTypeNode(node.typeArguments![0]!);
                const typeGuardFunctionIndentifier = generator.getTypeGuardFor(typeToCheck);

                return node.arguments.length > 0
                    ? factory.createCallExpression(typeGuardFunctionIndentifier, undefined, node.arguments)
                    : typeGuardFunctionIndentifier;
            }

            return visitEachChild(node, visit, context);
        }

        const transformedSourceFile = visitNode(sourceFile, visit);
        const generatedTypeGuards = generator.getAllGeneratedTypeGuards();

        return addGeneratedTypeGuardsToSourceFile(transformedSourceFile, generatedTypeGuards, context.factory);
    };
}

function isTypeGuard(node: Node): node is CallExpression {
    // TODO: further expand checks...
    return (
        isCallExpression(node) &&
        isIdentifier(node.expression) && node.expression.text === 'is' &&
        node.typeArguments !== undefined && node.typeArguments.length === 1 &&
        node.arguments.length <= 1
    );
}

function addGeneratedTypeGuardsToSourceFile(
    sourceFile: SourceFile,
    generatedTypeGuards: GeneratedTypeGuardEntry[],
    factory: NodeFactory,
): SourceFile {
    if (generatedTypeGuards.length === 0) {
        return sourceFile;
    }

    const generatedFunctionDeclarations = generatedTypeGuards.map(({ functionDeclation }) => functionDeclation);

    return factory.updateSourceFile(sourceFile, sourceFile.statements.concat(generatedFunctionDeclarations));
}
