import * as jest from "jest";
import { join, resolve } from "path";
import { CallExpression, Node, NumericLiteral, Project, ProjectOptions, SourceFile, SyntaxKind } from "ts-morph";
import { IMigration, Match, MatchedFile } from "./migrationTypes";

@Migration({
    name: "substr -> substring"
})
export class SubstrMigration implements IMigration {
    public getMatchedFiles(): MatchedFile[] {
        const project = new Project(this.projectOptions);
        return project.getSourceFiles()
            .filter(file => file.getFilePath().includes("/src/substr/"))
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
        return sourceFile
            .getDescendantsOfKind(SyntaxKind.CallExpression)
            .filter(isSubstrCall)
            .map(migrate)
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

function isSubstrCall(call: CallExpression): boolean {
    let propertyAccess = call.getExpressionIfKind(SyntaxKind.PropertyAccessExpression);
    if (!propertyAccess) {
        return false;
    }
    return propertyAccess.getNameNode().getText() === "substr";
}

function migrate(call: CallExpression): Match {
    const startArg = call.getArguments()[0];
    const lengthArg = call.getArguments()[1];
    const originalContent = call.getSourceFile().getFullText();
    const prefix = originalContent.substring(0, call.getStart());
    const suffix = originalContent.substring(call.getEnd());
    const propertyAccessNode = call.getExpressionIfKindOrThrow(SyntaxKind.PropertyAccessExpression);
    const propertyName = propertyAccessNode.getExpression().getText();
    const newArgs = getNewArgs(startArg, lengthArg);

    const modifiedContent = `${prefix}${propertyName}.substring(${newArgs})${suffix}`;

    return {
        label: `Start: ${startArg.getText()}; Length: ${lengthArg?.getText()}`,
        modifiedContent
    }
}

function getNewArgs(startArg: Node, lengthArg: Node | undefined): string {
    let newArgs = startArg.getText();
    if (lengthArg) {
        newArgs += ", ";
        if (NumericLiteral.isNumericLiteral(startArg)
            && NumericLiteral.isNumericLiteral(lengthArg)) {
            newArgs += (startArg.getLiteralValue() + lengthArg.getLiteralValue()) + "";
        } else {
            newArgs += startArg.getText() + " + " + lengthArg.getText();
        }
    }
    return newArgs;
}
