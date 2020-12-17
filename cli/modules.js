const simpleGit = require('simple-git');
const { getState } = require('../common/course');
const { unrecognized } = require('../common/errors');
const { moduleToBranch, branchToModule, chapterToBranch } = require('../common/utils');
const {
    isExistingModule, isExistingChapter,
    chapterFrom,
    setBranchValue, setBranchDescription, getModule
} = require('./git-helpers');

const git = simpleGit();

module.exports = {
    create: {
        description: 'Creates a new module for the course.',
        args: {
            moduleBranchOrName: {
                description: 'The branch or name to use for the module',
                type: 'STR',
                named: false,
                optional: false,
            },
            name: {
                description: 'If you need to specify both branch and name, use this arg.',
                type: 'STR',
                named: true,
                hint: '<module_name>',
                optional: true,
            },
            cwd: {
                description: 'Specify the directory to watch for changes and run commands in.',
                type: 'STR',
                named: true,
                hint: '<directory>',
                optional: true,
            },
        },
        async command({ moduleBranchOrName, name, cwd }) {
            const branch = moduleToBranch(moduleBranchOrName);
            name = name || branchToModule(moduleBranchOrName);

            if (await isExistingModule(branch)) {
                console.log(`A module with the branch name '${branch}' already exists.`);
                process.exit(1);
            }

            if (await isExistingModule(name)) {
                console.log(`A module with the name '${name}' already exists.`);
                process.exit(1);
            }

            await git.checkoutBranch(branch, 'main');
            await setBranchDescription(branch, name);
            if (cwd) {
                await setBranchValue(branch, 'cwd', cwd);
            }
        },
    },
    delete: {
        description: 'Removes a module from the course.',
        args: {
            module: {
                description: 'The module to delete, defaults to current.',
                type: 'STR',
                named: false,
                optional: true,
            },
            force: {
                description: 'Bypasses asking for confirmation that the module should be deleted.',
                type: 'BOOL',
                named: true,
                optional: true,
            },
            noRemote: {
                description: 'Keep remote versions of branches.',
                type: 'BOOL',
                named: true,
                optional: true,
            },
        },
        async command({ module, force, noRemote }) {
            if (!module) {
                const state = await getState();
                module = state.module;
            }

            if (!module) {
                console.error('You are not in a module or did not provide a module to be deleted.');
                process.exit(1);
            }

            const moduleDetails = await getModule(module);

            if (!moduleDetails) {
                unrecognized.module(module);
            }

            if (!force) {
                const confirm = (await inquirer.prompt({
                    type: 'confirm',
                    name: 'value',
                    default: false,
                    message: `Are you sure you want to delete module '${module}' and all its chapters?`
                })).value;

                if (!confirm) {
                    process.exit();
                }
            }

            const branches = [moduleDetails.value, ...moduleDetails.chapters.map(chapter => chapter.value)];
            await git.deleteLocalBranches(branches, true);

            if (!noRemote) {
                await git.push('origin', ['--delete', ...branches]);
            }
        },
    },
    summarize: {
        description: 'Creates a summary of a module. Defaults to summarizing all chapters.',
        args: {
            chapters: {
                description: 'Chapters to summarize.',
                type: 'STR[]',
                named: true,
                hint: '<c1>,<c2>',
                optional: true,
            },
            onlyShowOnComplete: {
                description: 'Only allow the user to select the summary after completing the module.',
                type: 'BOOL',
                named: true,
                optional: true,
            },
        },
        async command({ chapters, onlyShowOnComplete }) {
            const { module } = await getState();
            
            if (!module) {
                console.log('Cannot create module summary when not in a module.');
                process.exit(1);
            }

            const actualModule = await getModule(module);

            chapters = chapters || actualModule.chapters.map(chapter => chapter.value);

            for (const chapter of chapters) {
                if (!await isExistingChapter(module, chapter)) {
                    unrecognized.chapter(chapter);
                }
            }

            const toMerge = await Promise.all(chapters.map(chapterFrom(module)));

            const newBranch = chapterToBranch(module, 'summary');
            await git.checkoutBranch(newBranch, module.branch);

            for (const chapter of toMerge) {
                await git.mergeFromTo(chapter.value, newBranch);
            }

            await setBranchValue(newBranch, 'require-complete', !!onlyShowOnComplete);
        },
    },
    goto: {
        description: 'Navigates to an existing module.',
        args: {
            module: {
                description: 'The branch or name of the module to navigate to.',
                type: 'STR',
                named: false,
                optional: false,
            },
            chapter: {
                description: 'The branch or name of the chapter inside the module to navigate to.',
                type: 'STR',
                named: true,
                hint: '<chapter>',
                optional: true,
            },
        },
        async command({ module, chapter }) {
            const target = (await (chapter ? chapterFrom(module)(chapter) : getModule(module)));

            if (target) {
                await git.checkout(target.value);
            } else {
                console.log(`Unable to find match for '${chapter || module}'.`);
                process.exit(1);
            }
        },
    },
};
