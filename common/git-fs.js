const fs = require('fs');
const simpleGit = require('simple-git');
const git = simpleGit();
const path = require('path');

let root;
const rootDirectory = () => root
    ? Promise.resolve(root)
    : git.revparse(['--show-toplevel']).then(dir => root = dir);

const wrap = (fn, promise = true) => async (file, ...args) => {
    const root = await rootDirectory().catch(() => {
        console.log('Error getting git root:', fn, file);
        return process.cwd();
    });

    const base = promise ? fs.promises : fs;

    return base[fn](path.join(root, file), ...args);
};

module.exports = {
    isGitRepo: () => git.checkIsRepo(),
    isRoot: () => git.checkIsRepo('root'),
    rootDirectory,
    mkdir: wrap('mkdir'),
    watch: wrap('watch', false),
    writeFile: wrap('writeFile'),
    readFile: wrap('readFile'),
    access: wrap('access'),
    rm: wrap('rm'),
};
