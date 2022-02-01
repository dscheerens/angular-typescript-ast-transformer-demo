import { CreateTransformer } from 'ngx-ast-transform';
import { BinaryOperator, Node, SyntaxKind, VisitResult, isBinaryExpression, isNumericLiteral, visitEachChild, visitNode } from 'typescript';

const OPERATOR_FUNCTIONS = new Map<BinaryOperator, (a: number, b: number) => number>([
    [SyntaxKind.PlusToken, (a, b) => a + b],
    [SyntaxKind.MinusToken, (a, b) => a - b],
    [SyntaxKind.AsteriskToken, (a, b) => a * b],
    [SyntaxKind.SlashToken, (a, b) => a / b],
]);

export function simplifyNumberLiteralExpressions(): CreateTransformer {
    return () => (context) => (sourceFile) => {

        function visit(node: Node): VisitResult<Node> {
            if (isBinaryExpression(node) && isNumericLiteral(node.left) && isNumericLiteral(node.right)) {
                const operatorFunction = OPERATOR_FUNCTIONS.get(node.operatorToken.kind);

                if (operatorFunction) {
                    return context.factory.createNumericLiteral(operatorFunction(Number(node.left.text), Number(node.right.text)));
                }
            }

            return visitEachChild(node, visit, context);
        }

        return visitNode(sourceFile, visit);
    };
}
