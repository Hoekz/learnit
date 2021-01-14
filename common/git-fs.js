const fs = require('fs');
const simpleGit = require('simple-git');
const git = simpleGit();
const path = require('path');

const rootDirectory = () => git.revparse(['--show-toplevel']);

const wrap = (fn, promise = true) => async (file, ...args) => {
    const root = await rootDirectory();

    const base = promise ? fs.promises : fs;

    return base[fn](path.join(root, file), ...args);
};

module.exports = {
    rootDirectory,
    mkdir: wrap('mkdir'),
    watch: wrap('watch', false),
    writeFile: wrap('writeFile'),
    readFile: wrap('readFile'),
    access: wrap('access'),
};
