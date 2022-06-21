import { TestClass } from "../firstFile";

describe("TestClass", () => {
    it("runs the firstMethod", () => {
        expect(new TestClass().firstMethod()).toContain("First match");
    });
});
