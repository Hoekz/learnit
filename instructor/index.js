const inquirer = require('inquirer');
const simpleGit = require('simple-git');

const git = simpleGit();

const identity = a => a;

const settings = {
    asDelta: false, // controls whether a commit is visited or applied only as a stage

};

const prompt = (...args) => {
    console.clear();
    return inquirer.prompt(...args);
};

const getBranches = async (prefix, describe = identity) => {
    const branches = await git.branch(['--list', `${prefix}-*`]);
    const config = await git.listConfig();

    return branches.all.slice().sort().map((branch, index) => ({
        key: index < 10 ? (index + 1).toString().split('').pop() : null,
        name: branch,
        value: config.values['.git/config'][`branch.${branch}.description`] || describe(branch),
    }));
};

const mainMenu = {
    type: 'list',
    name: 'module',
    message: 'Choose a Module',
    choices: [],
};

const getModules = () => getBranches('module', branch => branch
    .replace('module-', '')
    .split('-')
    .map(word => word[0].toUpperCase() + word.substr(1))
    .join(' ')
);

const moduleMenu = {
    type: 'list',
    name: 'chapter',
    message: 'Choose a Chapter',
    choices: [],
};

const getChapters = async (module) => getBranches(`${module.replace('module-', '')}-chapter`, branch => branch
    .replace(`${module}-chapter-`, '')
    .split('-')
    .map(word => word[0].toUpperCase() + word.substr(1))
    .join(' ')
);

const main = async () => {
    mainMenu.choices = await getModules();

    const { module } = await prompt(mainMenu);

    moduleMenu.choices = await getChapters(module);

    const { chapter } = await prompt(moduleMenu);
};

main();
