import { readFileSync } from "fs";
import * as glob from "glob";
import * as jest from "jest";
import { join } from "path";
import { IMigration, Match, MatchedFile } from "./migrationTypes";

@Migration({
    name: "Brackets"
})
class BracketMigration implements IMigration {
    public getMatchedFiles(): MatchedFile[] {
        return this.getFiles().map(file => {
            return {
                path: file,
                matches: this.getMatchesOf(file)
            }
        });
    }

    private getFiles(): string[] {
        const originalPath = join(__dirname, "../../src/brackets/**/*.ts");
        const globPath = originalPath.replace(/\\/g, "/");

        return glob.sync(globPath);
    }

    private getMatchesOf(filePath: string): Match[] {
        const content = readFileSync(filePath, { encoding: "utf-8" });
        const regexMatches = Array.from(content.matchAll(/>>>(.+)<<</g));

        return regexMatches.map((match, index) => {
            const prefix = content.substring(0, match.index!);
            const replacement = `<<<${match[1]}>>>`;
            const suffix = content.substring(match.index! + replacement.length);

            return {
                label: `(${index + 1}) ${match[1]}`,
                modifiedContent: prefix + replacement + suffix
            } as Match;
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
