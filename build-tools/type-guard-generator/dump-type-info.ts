import { SyntaxKind, Type, TypeChecker, TypeFlags, isIdentifier, isTypeReferenceNode } from 'typescript';

export function dumpTypeDetails(type: Type, typeChecker: TypeChecker): void {
    const typeFlags = getIndividualTypeFlags(type.flags);
    const typeName = typeChecker.typeToString(type);
    const typeNode = typeChecker.typeToTypeNode(type, undefined, undefined);
    console.log(`[${typeName}]`);
    console.log(` - flags: ${type.flags}`);
    console.log(` - flags: ${typeFlags.map((flag) => TypeFlags[flag]).join(', ')}`);
    if (typeNode) {
        const typeNodeKind = typeNode.kind;
        console.log(` - typeNode.kind: ${SyntaxKind[typeNodeKind]}`);

        if (isTypeReferenceNode(typeNode)) {
            if (isIdentifier(typeNode.typeName)) {
                console.log(` - typeNode.typeName:`, typeNode.typeName.text);
            }
        }
    }
}

function getIndividualTypeFlags(typeFlags: TypeFlags): TypeFlags[] {
    return Array.from(Object.values(TypeFlags))
        .filter(isTypeFlag)
        .reduce<TypeFlags[]>((result, typeFlag) => typeFlags & typeFlag ? [...result, typeFlag] : result, []);
}

function isTypeFlag(value: unknown): value is TypeFlags {
    return typeof value === 'number' && value in TypeFlags;
}
