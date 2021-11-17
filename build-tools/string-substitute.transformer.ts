import { Node, visitEachChild, visitNode, VisitResult, isStringLiteral } from 'typescript';

import { CreateTransformers } from './add-transformer';

export interface StringSubstituteDelimiters {
    start: string;
    end: string;
}

export function stringSubstitute(
    substituteValues: unknown,
    delimiters: StringSubstituteDelimiters = { start: '<<<', end: '>>>' },
): CreateTransformers {
    const stringSubstituter = new StringSubstituter(substituteValues, delimiters);

    return () => [(context) => (sourceFile) => {
        function visit(node: Node): VisitResult<Node> {
            if (isStringLiteral(node)) {
                const subtitionValue = stringSubstituter.getSubstitutionFor(node.text);

                if (subtitionValue !== undefined) {
                return context.factory.createStringLiteral(subtitionValue);
                }
            }

            return visitEachChild(node, visit, context);
        }

        return visitNode(sourceFile, visit);
    }];
}

class StringSubstituter {
    private readonly substitutionCache = new Map<string, string | undefined>();

    constructor(
        private readonly substituteValues: unknown,
        private readonly delimiters: StringSubstituteDelimiters,
    ) {}

    public getSubstitutionFor(value: string): string | undefined {
        if (!value.startsWith(this.delimiters.start) || !value.endsWith(this.delimiters.end)) {
            return undefined;
        }

        const substitutionKey = value.substring(this.delimiters.start.length, value.length - this.delimiters.end.length);

        if (this.substitutionCache.has(substitutionKey)) {
            return this.substitutionCache.get(substitutionKey);
        }

        const substitutionValue = getSubstitionValue(this.substituteValues, substitutionKey.split('.'));

        this.substitutionCache.set(substitutionKey, substitutionValue);

        return substitutionValue;
    }
}

function getSubstitionValue(values: unknown, [key, ...subProperties]: string[]): string | undefined {
    if (key === undefined) {
        return values === undefined ? undefined : String(values);
    }

    return hasProperty(values, key) ? getSubstitionValue(values[key], subProperties) : undefined;
}

function hasProperty<S, T extends string>(subject: S, key: T): subject is S & { [k in T]: unknown } {
    return typeof subject === 'object' && subject !== null && key in subject;
}
