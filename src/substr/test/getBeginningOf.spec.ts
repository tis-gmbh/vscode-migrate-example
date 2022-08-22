import { getBeginningOf } from "../getBeginningOf";

xdescribe("getBeginningOf", () => {
    it("returns first 5 letters of string that's longer than 5 letters", () => {
        expect(getBeginningOf("Supercalifragilisticexpialidocious")).toBe("Super");
    });

    it("returns the whole string if it is shorter than 5 letters", () => {
        expect(getBeginningOf("Hi")).toBe("Hi");
    });
});
