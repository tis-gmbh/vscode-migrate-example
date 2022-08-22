import { getLastWord } from "../getLastWordOf";

describe("getLastWord", () => {
    it("returns second word if string contains two words", () => {
        return expect(getLastWord("Hello World")).toBe("World");
    });

    it("returns first word if string only contains one word", () => {
        return expect(getLastWord("Hello")).toBe("Hello");
    });
});
