describe("various", () => {
    const testWord = "Supercalifragilisticexpialidocious";
    it("correctly extracts middle section", () => {
        expect(testWord.substr(2, 4)).toBe("perc");
    });

    it("wraps negative start", () => {
        expect(testWord.substr(-3)).toBe("ous");
    });

    it("treats negative length as 0", () => {
        expect(testWord.substr(7, -5)).toBe("");
    });
});
