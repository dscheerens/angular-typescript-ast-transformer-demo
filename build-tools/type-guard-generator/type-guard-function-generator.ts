import {
    Block, Expression, FunctionDeclaration, Identifier, IntersectionType, LiteralTypeNode, Program, SyntaxKind, TransformationContext, Type,
    UnionType, isPropertySignature,
} from 'typescript';

import { dumpTypeDetails } from './dump-type-info';
import { TypeAnalyzer } from './type-analyzer';
import { TypeNameGenerator } from './type-name-generator';

export interface GeneratedTypeGuardEntry {
    identifier: Identifier;
    functionDeclation: FunctionDeclaration;
}

export class TypeGuardGenerator {
    private readonly generatedTypeGuards = new Map<Type, GeneratedTypeGuardEntry>();
    private readonly allocatedTypeGuardIdentifiers = new Map<Type, Identifier>();
    private readonly usedTypeGuardNames = new Set<string>();
    private readonly valueIdentifier = this.context.factory.createIdentifier('value');

    constructor(
        private readonly program: Program,
        private readonly context: TransformationContext,
        private readonly typeAnalyzer: TypeAnalyzer,
        private readonly typeNameGenerator: TypeNameGenerator,
    ) {}

    public getAllGeneratedTypeGuards(): GeneratedTypeGuardEntry[] {
        return Array.from(this.generatedTypeGuards.values());
    }

    public getTypeGuardFor(type: Type): Identifier {
        let identifier = this.allocatedTypeGuardIdentifiers.get(type);

        if (!identifier) {
            identifier = this.allocateTypeGuardIdenifier(type);

            const functionDeclation = this.createTypeGuardFunction(type, identifier);

            this.generatedTypeGuards.set(type, { identifier, functionDeclation });
        }

        return identifier;
    }

    private allocateTypeGuardIdenifier(type: Type): Identifier {
        const typeGuardName = this.allocateUnqiueTypeGuardName(type);

        const typeGuardIdentifier = this.context.factory.createIdentifier(`__is${typeGuardName}__`);

        this.allocatedTypeGuardIdentifiers.set(type, typeGuardIdentifier);

        return typeGuardIdentifier;
    }

    private allocateUnqiueTypeGuardName(type: Type): string {
        const desiredName = this.typeNameGenerator.getTypeName(type);

        if (!this.usedTypeGuardNames.has(desiredName)) {
            this.usedTypeGuardNames.add(desiredName);

            return desiredName;
        }

        const similarNamedTypeGuards = Array.from(this.usedTypeGuardNames).filter((name) => name.startsWith(desiredName));

        const highestCount = Math.max(...similarNamedTypeGuards.map((name) => {
            const count = name.substring(desiredName.length).match(/^_(\d+)$/)?.[1];

            return count ? Number(count) : 1;
        }));

        const uniqueName = `${desiredName}_${highestCount + 1}`;

        this.usedTypeGuardNames.add(uniqueName);

        return uniqueName;
    }

    private createTypeGuardFunction(type: Type, functionIdentifier: Identifier): FunctionDeclaration {
        const factory = this.context.factory;

        return factory.createFunctionDeclaration(
            undefined,
            undefined,
            undefined,
            functionIdentifier,
            undefined,
            [factory.createParameterDeclaration(undefined, undefined, undefined, this.valueIdentifier)],
            undefined,
            this.createTypeGuardImplementation(type),
        );
    }

    private createTypeGuardImplementation(type: Type): Block {
        const factory = this.context.factory;

        if (this.typeAnalyzer.isBoolean(type)) {
            return this.createSingleExpressionFunctionBody(this.createTypeOfCheck('boolean'));
        }
        if (this.typeAnalyzer.isNumber(type)) {
            return this.createSingleExpressionFunctionBody(this.createTypeOfCheck('number'));
        }
        if (this.typeAnalyzer.isString(type)) {
            return this.createSingleExpressionFunctionBody(this.createTypeOfCheck('string'));
        }
        if (this.typeAnalyzer.isLiteral(type)) {
            return this.createSingleExpressionFunctionBody(this.createLiteralCheck(type));
        }
        if (this.typeAnalyzer.isArray(type)) {
            const elementType = this.typeAnalyzer.getElementTypeOfArray(type);

            return this.createSingleExpressionFunctionBody(this.createArrayCheck(elementType));
        }
        if (this.typeAnalyzer.isUnion(type)) {
            return this.createSingleExpressionFunctionBody(this.createUnionCheck(type));
        }
        if (this.typeAnalyzer.isIntersection(type)) {
            return this.createSingleExpressionFunctionBody(this.createIntersectionCheck(type));
        }
        if (this.typeAnalyzer.isStructuredType(type)) {
            return this.createSingleExpressionFunctionBody(this.createStructuredTypeCheck(type));
        }

        console.log('\n\n**********************************************************************');
        dumpTypeDetails(type, this.program.getTypeChecker());
        console.log('**********************************************************************\n\n');

        return this.createSingleExpressionFunctionBody(factory.createFalse());
    }

    private createSingleExpressionFunctionBody(expression: Expression): Block {
        return this.context.factory.createBlock([
            this.context.factory.createReturnStatement(expression),
        ]);
    }

    private createTypeOfCheck(expectedType: TypeOfResult, expression?: Expression): Expression {
        return this.context.factory.createStrictEquality(
            this.context.factory.createTypeOfExpression(expression ?? this.valueIdentifier),
            this.context.factory.createStringLiteral(expectedType),
        );
    }

    private createArrayCheck(elementType: Type): Expression {
        const { factory } = this.context;

        const typeGuardFunction = this.getTypeGuardFor(elementType);

        return factory.createLogicalAnd(
            factory.createCallExpression(
                factory.createPropertyAccessExpression(factory.createIdentifier('Array'), 'isArray'),
                undefined,
                [this.valueIdentifier],
            ),
            factory.createCallExpression(
                factory.createPropertyAccessExpression(this.valueIdentifier, 'every'),
                undefined,
                [typeGuardFunction],
            ),
        );
    }

    private createUnionCheck(unionType: UnionType): Expression {
        const { factory } = this.context;

        return unionType.types
            .map((type) => factory.createCallExpression(
                this.getTypeGuardFor(type),
                undefined,
                [this.valueIdentifier],
            ) as Expression)
            .reduce((previousChecks, nextCheck) => factory.createLogicalOr(previousChecks, nextCheck));
    }

    private createIntersectionCheck(intersectionType: IntersectionType): Expression {
        const { factory } = this.context;

        return intersectionType.types
            .map((type) => factory.createCallExpression(
                this.getTypeGuardFor(type),
                undefined,
                [this.valueIdentifier],
            ) as Expression)
            .reduce((previousChecks, nextCheck) => factory.createLogicalAnd(previousChecks, nextCheck));
    }

    private createStructuredTypeCheck(structuredType: Type): Expression {
        const { factory } = this.context;

        const properties = structuredType.getProperties()
            .map((property) => {
                const propertyTypeNode = (property.getDeclarations() ?? []).find(isPropertySignature)?.type;

                return propertyTypeNode
                    ? { property, propertyType: this.program.getTypeChecker().getTypeFromTypeNode(propertyTypeNode) }
                    : undefined;
            })
            .filter(notUndefined);

        const propertyChecks = properties.flatMap(({ property, propertyType }) => [
            factory.createBinaryExpression(
                factory.createStringLiteral(property.name, true),
                factory.createToken(SyntaxKind.InKeyword),
                this.valueIdentifier,
            ),
            factory.createCallExpression(
                this.getTypeGuardFor(propertyType),
                undefined,
                [factory.createPropertyAccessExpression(this.valueIdentifier, property.name)],
            ),
        ]);

        const checks = [
            this.createTypeOfCheck('object'),
            factory.createStrictInequality(this.valueIdentifier, factory.createNull()),
            ...propertyChecks,
        ];

        return checks.reduce((mergedExpression, check) => factory.createLogicalAnd(mergedExpression, check));
    }

    private createLiteralCheck(type: Type): Expression {
        const typeNode = this.program.getTypeChecker().typeToTypeNode(type, undefined, undefined) as LiteralTypeNode;

        return this.context.factory.createStrictEquality(this.valueIdentifier, typeNode.literal);
    }
}

type TypeOfResult = 'string' | 'number' | 'bigint' | 'boolean' | 'symbol' | 'undefined' | 'object' | 'function';

function notUndefined<T>(value: T | undefined): value is T {
    return value !== undefined;
}
