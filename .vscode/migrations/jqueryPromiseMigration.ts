import * as jest from "jest";
import { join, resolve } from "path";
import { Block, CallExpression, Expression, FunctionDeclaration, Identifier, NullLiteral, Project, ProjectOptions, PropertyAccessExpression, SourceFile, SyntaxKind } from "ts-morph";
import { IMigration, Match, MatchedFile } from "./migrationTypes";

type FailureCallback = FunctionDeclaration | NullLiteral;


/**
 * Warning: This migration is a simplified example and should not be
 * used in this form for production code, as it is incomplete.
 * For the sake of readability, the following scenarios are not
 * supported:
 * - `failFilter` that is not defined inline, but referenced
 * - `failFilter` that returns nothing (implicit return)
 */
@Migration({
    name: "JQuery Promises"
})
export class JQueryPromiseMigration implements IMigration {
    public getMatchedFiles(): MatchedFile[] {
        const project = new Project(this.projectOptions);
        return project.getSourceFiles()
            .filter(file => file.getFilePath().includes("/src/jqueryPromise/"))
            .filter(file => !file.getFilePath().includes("/src/jqueryPromise/test/"))
            .map(file => ({
                path: file.getFilePath(),
                matches: this.getMatchesOf(file)
            }));
    }

    private get projectOptions(): ProjectOptions {
        return {
            tsConfigFilePath: resolve(__dirname, "../../tsconfig.json")
        };
    }

    private getMatchesOf(sourceFile: SourceFile): Match[] {
        return this.findAffectedReturns(sourceFile)
            .sort((r1, r2) => r1.getStartLineNumber() - r2.getStartLineNumber())
            .map((r, index) => this.getMatchFrom(r, index));
    }

    private getMatchFrom(expression: Expression, index: number): Match {
        const original = expression.getSourceFile().getFullText();
        const returnValue = expression.getText();
        const firstLine = returnValue.split("\r\n")[0];

        return {
            label: `(${index + 1}) ${firstLine}`,
            modifiedContent:
                original.slice(0, expression.getStart())
                + "$.Deferred().reject(" + returnValue + ")"
                + original.slice(expression.getEnd())
        } as Match;
    }

    private findAffectedReturns(sourceFile: SourceFile): Expression[] {
        const thenCalls = this.getThenCallsIn(sourceFile);
        const failureCallbacks = this.getFailureCbsOf(thenCalls);
        return this.getReturnValuesOf(failureCallbacks)
            .filter(isNonPromise);
    }

    private getThenCallsIn(sourceFile: SourceFile): CallExpression[] {
        return sourceFile
            .getDescendantsOfKind(SyntaxKind.CallExpression)
            .filter(isThenCall)
    }

    private getFailureCbsOf(callExpressions: CallExpression[]): FailureCallback[] {
        return callExpressions.map(callExpression => {
            const failureCallback = callExpression.getArguments()[1];

            if (Identifier.isIdentifier(failureCallback)) {
                const name = failureCallback.getText();
                const lineNumber = failureCallback.getStartLineNumber();
                const filePath = failureCallback.getSourceFile().getFilePath();
                throw new Error(`Identifiers as failure callbacks are not supported. Found one called ${name} at line ${lineNumber} in ${filePath}`);
            }

            return failureCallback as FailureCallback;
        });
    }

    private getReturnValuesOf(failureCallbacks: FailureCallback[]): Expression[] {
        return failureCallbacks
            .flatMap(failureCallback => {
                if (NullLiteral.isNullLiteral(failureCallback)) return [];

                const body = failureCallback.getBody();
                if (Expression.isExpression(body)) return [body];
                if (!Block.isBlock(body)) throw new Error(`Unsupported fail callback type ${body.getKindName()}.`);

                return body
                    .getChildrenOfKind(SyntaxKind.ReturnStatement)
                    .map(statement => statement.getExpression())
                    .filter(expression => !!expression);
            });
    }

    public async verify(): Promise<void> {
        const result = await jest.runCLI({} as any, [join(__dirname, "../..")]);
        if (result.results.numFailedTests > 0
            || result.results.numFailedTestSuites > 0
            || result.results.numRuntimeErrorTestSuites > 0) {
            throw new Error("Tests failed");
        }
    }
}

function isNonPromise(expression: Expression): boolean {
    return !isPromise(expression);
}

function isPromise(expression: Expression): boolean {
    const returnType = expression.getType();
    const typeName = returnType.getText();
    return typeName.startsWith("JQueryPromise")
        || typeName.startsWith("JQueryDeferred");
}

function isThenCall(callExpr: CallExpression): boolean {
    const propAccess = callExpr.getExpression() as PropertyAccessExpression;
    if (!propAccess.getNameNode) return false;
    const methodNameIdent = propAccess.getNameNode();

    if (!methodNameIdent || methodNameIdent.getText() !== "then") return false;

    const typeCalledOn = callExpr.getType().getText();
    return typeCalledOn.startsWith("JQueryPromise");
}
