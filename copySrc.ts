import { cp, rmdir, stat } from "fs/promises";

async function copySrc() {
    let dirExists = false;
    try {
        await stat("./src");
        dirExists = true;
    } catch (error) { }

    if (dirExists) {
        await rmdir("./src", { recursive: true });
    }
    await cp("./originalSrc", "./src", { recursive: true });
}

copySrc();
