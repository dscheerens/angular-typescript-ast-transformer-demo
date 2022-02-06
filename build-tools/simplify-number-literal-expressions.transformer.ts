import { CreateTransformer } from 'ngx-ast-transform';
import { BinaryOperator, Node, SyntaxKind, VisitResult, isBinaryExpression, isNumericLiteral, visitEachChild, visitNode } from 'typescript';

const OPERATOR_FUNCTIONS = new Map<BinaryOperator, (a: number, b: number) => number>([
    [SyntaxKind.PlusToken,     (a, b) => a + b],
    [SyntaxKind.MinusToken,    (a, b) => a - b],
    [SyntaxKind.AsteriskToken, (a, b) => a * b],
    [SyntaxKind.SlashToken,    (a, b) => a / b],
]);

export function simplifyNumberLiteralExpressions(): CreateTransformer {
    return () => (context) => (sourceFile) => {

        function visit(node: Node): VisitResult<Node> {
            const tranformedNode = visitEachChild(node, visit, context);

            if (isBinaryExpression(tranformedNode) && isNumericLiteral(tranformedNode.left) && isNumericLiteral(tranformedNode.right)) {
                const operatorFunction = OPERATOR_FUNCTIONS.get(tranformedNode.operatorToken.kind);

                if (operatorFunction) {
                    return context.factory.createNumericLiteral(operatorFunction(
                        Number(tranformedNode.left.text),
                        Number(tranformedNode.right.text),
                    ));
                }
            }

            return tranformedNode;
        }

        return visitNode(sourceFile, visit);
    };
}
