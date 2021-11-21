import {
    IntersectionType, SyntaxKind, Type, TypeChecker, TypeFlags, TypeReference, UnionType, isArrayTypeNode, isLiteralTypeNode,
} from 'typescript';

export class TypeAnalyzer {
    constructor(
        private readonly typeChecker: TypeChecker,
    ) {}

    public isBoolean(type: Type): boolean {
        return !!(type.flags & TypeFlags.Boolean);
    }

    public isNumber(type: Type): boolean {
        return !!(type.flags & TypeFlags.Number);
    }

    public isString(type: Type): boolean {
        return !!(type.flags & TypeFlags.String);
    }

    public isArray(type: Type): type is TypeReference {
        const typeNode = this.typeChecker.typeToTypeNode(type, undefined, undefined);

        return typeNode ? isArrayTypeNode(typeNode) : false;
    }

    public getElementTypeOfArray(arrayType: TypeReference): Type {
        return this.typeChecker.getTypeArguments(arrayType)[0]!;
    }

    public isUnion(type: Type): type is UnionType {
        return type.isUnion();
    }

    public isLiteral(type: Type): boolean {
        const typeNode = this.typeChecker.typeToTypeNode(type, undefined, undefined);

        return !!(type.flags & TypeFlags.Literal) && !!typeNode && isLiteralTypeNode(typeNode);
    }

    public isBooleanLiteral(type: Type, value?: boolean): boolean {
        const typeNode = this.typeChecker.typeToTypeNode(type, undefined, undefined);

        return (
            !!(type.flags & TypeFlags.BooleanLiteral) &&
            !!typeNode &&
            isLiteralTypeNode(typeNode) &&
            (
                value === undefined ||
                value === true && typeNode.literal.kind === SyntaxKind.TrueKeyword || // tslint:disable-line:no-boolean-literal-compare
                value === false && typeNode.literal.kind === SyntaxKind.FalseKeyword  // tslint:disable-line:no-boolean-literal-compare
            )
        );
    }

    public isNumberLiteral(type: Type): boolean {
        const typeNode = this.typeChecker.typeToTypeNode(type, undefined, undefined);

        return !!(type.flags & TypeFlags.NumberLiteral) && !!typeNode && isLiteralTypeNode(typeNode);
    }

    public isIntersection(type: Type): type is IntersectionType {
        return !!(type.flags && TypeFlags.Intersection) && !!(type as Partial<IntersectionType>).types;
    }

    public isStructuredType(type: Type): boolean {
        return !!(type.flags & TypeFlags.StructuredType);
    }
}
