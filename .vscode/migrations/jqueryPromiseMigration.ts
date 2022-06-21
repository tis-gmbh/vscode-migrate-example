import { join, resolve } from "path";
import { Block, CallExpression, Expression, FunctionDeclaration, Project, PropertyAccessExpression, SourceFile, SyntaxKind } from "ts-morph";
import { IMigration, Match, MatchedFile } from "./migrationTypes";

@Migration({
    name: "JQuery Promises"
})
export class JQueryPromiseMigration implements IMigration {
    private workspacePath = resolve(__dirname, "../..");
    private tsConfigPath: string = join(this.workspacePath, "tsconfig.json");
    private readonly project: Project;

    public constructor() {
        this.project = new Project({
            tsConfigFilePath: this.tsConfigPath,
            compilerOptions: {
                sourceMap: false,
                inlineSourceMap: false
            }
        });
    }

    public getMatchedFiles(): MatchedFile[] | Promise<MatchedFile[]> {
        return this.project.getSourceFiles().map(file => {
            return {
                path: file.getFilePath(),
                matches: this.getMatchesOf(file)
            };
        });
    }

    private getMatchesOf(sourceFile: SourceFile): Match[] {
        return this.findAffectedReturns(sourceFile)
            .sort((r1, r2) => r1.getStartLineNumber() - r2.getStartLineNumber())
            .map((r, index) => this.getMatchFrom(r, index));
    }

    private getMatchFrom(returnExpression: Expression, index: number): Match {
        const originalContent = returnExpression.getSourceFile().getText();
        const modifiedContent = originalContent.slice(0, returnExpression.getStart())
            + `$.Deferred().reject(${returnExpression?.getText()})`
            + originalContent.slice(returnExpression.getEnd());

        return {
            label: `(${index + 1}) ${returnExpression?.getText().split("\r\n")[0]}`,
            modifiedContent
        };
    }

    private findAffectedReturns(sourceFile: SourceFile): Expression[] {
        return sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression)
            .flatMap(descendant => this.getFailureReturnsOf(descendant))
            .filter(isNonPromise);
    }

    private getFailureReturnsOf(callExpr: CallExpression): Expression[] {
        if (!isThenCall(callExpr)) return [];

        const failCallback: FunctionDeclaration = callExpr.getArguments()[1] as FunctionDeclaration;
        if (!failCallback) return [];
        if (!failCallback.getBody) return [];

        const body = failCallback.getBody();
        if (!body) return [];

        if (Block.isBlock(body)) {
            return body.getChildrenOfKind(SyntaxKind.ReturnStatement)
                .map(statement => statement.getExpression())
                .filter(expression => !!expression);
        } else if (Expression.isExpression(body)) {
            return [body];
        } else {
            throw new Error(`Unsupported fail callback type ${body.getKindName()}.`);
        }
    }
}

function isNonPromise(expression: Expression): boolean {
    return !isPromise(expression);
}

function isPromise(expression: Expression): boolean {
    const returnType = expression.getType().getText();
    return returnType?.startsWith("JQueryPromise") || returnType?.startsWith("JQueryDeferred") || false;
}

function isThenCall(callExpr: CallExpression): boolean {
    const propAccess = callExpr.getExpression() as PropertyAccessExpression;
    if (!propAccess.getNameNode) return false;
    const methodNameIdent = propAccess.getNameNode();

    if (!methodNameIdent || methodNameIdent.getText() !== "then") return false;

    const typeCalledOn = callExpr.getType().getText();
    return typeCalledOn.startsWith("JQueryPromise");
}
