const simpleGit = require('simple-git');
const { getState } = require('../common/course');
const { moduleToBranch, branchToModule, chapterToBranch } = require('../common/utils');
const {
    isExistingModule, isExistingChapter,
    chapterFrom,
    setBranchValue, setBranchDescription
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

            await git.checkoutBranch(branch, 'master');
            await setBranchDescription(branch, name);
            if (cwd) {
                await setBranchValue(branch, 'cwd', cwd);
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
            const state = await getState();
            
            if (!state.module) {
                console.log('Cannot create module summary when not in a module.');
                process.exit(1);
            }
            
            const { actualChapters: chapters } = await getModule(state.module);

            chapters = chapters || actualChapters.map(chapter => chapter.value);

            for (const chapter of chapters) {
                if (!await isExistingChapter(chapter)) {
                    console.log(`Unrecognized chapter '${chapter}'. Either use the branch name or title of the chapter.`);
                    process.exit(1);
                }
            }

            const toMerge = await Promise.all(chapters.map(chapterFrom(state.module)));

            const newBranch = chapterToBranch(state.module, 'summary');
            await git.checkoutBranch(newBranch, module.branch);

            for (const chapter of toMerge) {
                await git.mergeFromTo(chapter.value, newBranch);
            }

            await setBranchValue(newBranch, 'require-complete', !!onlyShowOnComplete);
        },
    },
};
