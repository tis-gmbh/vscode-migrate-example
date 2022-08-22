export function getLastWord(text: string): string {
    const lastSpace = text.lastIndexOf(" ") + 1;
    return text.substr(lastSpace);
}
