import { resolve } from "path";
import { CallExpression, NumericLiteral, Project, ProjectOptions, SourceFile, SyntaxKind } from "ts-morph";
import { IMigration, Match, MatchedFile } from "./migrationTypes";

@Migration({
    name: "substr -> substring"
})
export class SubstrMigration implements IMigration {
    public getMatchedFiles(): MatchedFile[] {
        const project = new Project(this.projectOptions);
        return project.getSourceFiles()
            .filter(file => file.getFilePath().includes("/src/substr/"))
            .filter(file => !file.getFilePath().includes("/src/substr/test/"))
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

}

function isSubstrCall(call: CallExpression): boolean {
    let propertyAccess = call.getExpressionIfKind(SyntaxKind.PropertyAccessExpression);
    if (!propertyAccess) {
        return false;
    }
    return propertyAccess.getNameNode().getText() === "substr";
}

function migrate(call: CallExpression): Match {
    let startArg = call.getArguments()[0];
    let lengthArg = call.getArguments()[1];
    let modifiedContent = call.getSourceFile().getFullText();
    const substrNode = call.getExpressionIfKindOrThrow(SyntaxKind.PropertyAccessExpression).getNameNode();

    let endArg = "";
    if (lengthArg) {
        if (NumericLiteral.isNumericLiteral(startArg)
            && NumericLiteral.isNumericLiteral(lengthArg)) {
            endArg = (startArg.getLiteralValue() + lengthArg.getLiteralValue()) + "";
        } else {
            endArg = startArg.getText() + " + " + lengthArg.getText();
        }
    }

    const prefix = modifiedContent.substring(0, substrNode.getStart());
    const suffix = modifiedContent.substring(call.getEnd());
    modifiedContent = `${prefix}substring(${startArg.getText()}, ${endArg || ""})${suffix}`;

    return {
        label: `Start: ${startArg.getText()}; Length: ${lengthArg?.getText()}`,
        modifiedContent
    }
}
