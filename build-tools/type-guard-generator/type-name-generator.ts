import { Type, TypeChecker, isIdentifier, isTypeReferenceNode } from 'typescript';

import { TypeAnalyzer } from './type-analyzer';

export class TypeNameGenerator {
    private readonly typeNames = new Map<Type, string>();

    private nextAnonymousTypeId = 1;

    constructor(
        private readonly typeChecker: TypeChecker,
        private readonly typeAnalyzer: TypeAnalyzer,
    ) {}

    public getTypeName(type: Type): string {
        let typeName = this.typeNames.get(type);

        if (!typeName) {
            typeName = this.determineTypeName(type);
            this.typeNames.set(type, typeName);
        }

        return typeName;
    }

    private determineTypeName(type: Type): string {
        if (this.typeAnalyzer.isBoolean(type)) {
            return 'Boolean';
        }
        if (this.typeAnalyzer.isNumber(type)) {
            return 'Number';
        }
        if (this.typeAnalyzer.isString(type)) {
            return 'String';
        }
        if (this.typeAnalyzer.isArray(type)) {
            return `ArrayOf${this.getTypeName(this.typeAnalyzer.getElementTypeOfArray(type))}`;
        }
        if (this.typeAnalyzer.isUnion(type)) {
            return type.types.map((memberType) => this.determineTypeName(memberType)).join('Or');
        }
        if (this.typeAnalyzer.isBooleanLiteral(type, true)) {
            return 'True';
        }
        if (this.typeAnalyzer.isBooleanLiteral(type, false)) {
            return 'False';
        }

        const typeNode = this.typeChecker.typeToTypeNode(type, undefined, undefined);

        if (this.typeAnalyzer.isNumberLiteral(type)) {
            return escapeNumberLiteral(this.typeChecker.typeToString(type));
        }

        if (!!typeNode && isTypeReferenceNode(typeNode) && isIdentifier(typeNode.typeName)) {
            return typeNode.typeName.text;
        }

        if (this.typeAnalyzer.isIntersection(type)) {
            return type.types.map((memberType) => this.determineTypeName(memberType)).join('And');
        }

        return `AnonymousType${this.nextAnonymousTypeId++}`;
    }
}

function escapeNumberLiteral(value: string): string {
    return value
        .replace(/-/g, 'Minus')
        .replace(/\./g, 'Point')
        .replace(/e/gi, 'Times10ToThe')
        .replace(/\+/g, '');
}
