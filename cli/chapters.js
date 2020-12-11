const simpleGit = require('simple-git');
const { getState } = require('../common/course');
const { unrecognized } = require('../common/errors');
const { chapterToBranch, moduleToBranch } = require('../common/utils');
const {
    nextChapterIndex,
    getBranchConfig, setBranchValue, setBranchDescription, chapterFrom,
} = require('./git-helpers');

const git = simpleGit();

module.exports = {
    create: {
        description: 'Creates a new chapter in a module (defaults to current module).',
        args: {
            chapterTitle: {
                description: 'Title of the new chapter.',
                type: 'STR',
                named: false,
                optional: true,
            },
            module: {
                description: 'The module to create the chapter in. Defaults to current.',
                type: 'STR',
                named: true,
                hint: '<module_branch_or_name>',
                optional: true,
            },
            merge: {
                description: 'Whether the chapter should be merged upon completion.',
                type: 'BOOL',
                named: true,
                hint: '[true]',
                optional: true,
            },
            base: {
                description: 'What point to build the chapter off of. Defaults to the top of the module branch.',
                type: 'STR',
                named: true,
                hint: '<module>',
                optional: true,
            },
        },
        async command({ chapterTitle, module, merge, base }) {
            const state = await getState();

            if (module && !await isExistingModule(module)) {
                console.log(`Module '${module}' does not exist.`);
                process.exit(1);
            }

            module = module || state.module;

            if (!module) {
                console.log(`Cannot create chapter: you are not current in a module or did not specify a module.`);
                process.exit(1);
            }

            const chapter = chapterTitle || await nextChapterIndex(module);

            if (await isExistingChapter(chapter)) {
                console.log(`Chapter '${chapter}' already exists.`);
                process.exit(1);
            }

            const newBranch = chapterToBranch(module || state.module, chapter);
            base = moduleToBranch(module); // TODO: allow different base

            await git.checkoutBranch(newBranch, base);
            await setBranchDescription(newBranch, chapter);

            if (merge !== undefined) {
                await setBranchValue(newBranch, 'merge', !!merge);
            }
        },
    },
    delete: {
        description: 'Removes a chapter from a module.',
        args: {
            chapter: {
                description: 'The chapter to delete, defaults to current.',
                type: 'STR',
                named: false,
                optional: true,
            },
            module: {
                description: 'The module containing the chapter, defaults to current.',
                type: 'STR',
                named: true,
                hint: '<module>',
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
        async command({ chapter, module, force, noRemote }) {
            // TODO: implement deletion of chapter
            const state = await getState();

            if (!module) {
                module = state.module;
            }

            if (!module) {
                console.error('You are not in a module or did not provide a module.');
                process.exit(1);
            }

            if (!chapter) {
                chapter = state.chapter;
            }

            if (!chapter) {
                console.error('You are not in a chapter or did not provide a chapter to be deleted.');
                process.exit(1);
            }

            const chapterDetails = await chapterFrom(module)(chapter);

            if (!chapterDetails) {
                unrecognized.chapter(chapter);
            }

            if (!force) {
                const confirm = (await inquirer.prompt({
                    type: 'confirm',
                    name: 'value',
                    default: false,
                    message: `Are you sure you want to delete chapter '${chapter}'?`
                })).value;

                if (!confirm) {
                    process.exit();
                }
            }

            const branch = chapterDetails.value;
            await git.deleteLocalBranch(branch, true);

            if (!noRemote) {
                await git.push('origin', ['--delete', branch]);
            }
        },
    },
    finish: {
        description: 'Designates a chapter as completed and optionally merges it back into the module branch.',
        args: {
            merge: {
                description: 'Whether to merge the chapter branch. Can also be set at time of creation.',
                type: 'BOOL',
                named: true,
                hint: '[value_set_when_created]',
                optional: true,
            },
        },
        async command({ merge }) {
            const state = await getState();

            if (!state.chapter) {
                console.log('You are not currently navigated to a chapter.');
                process.exit(1);
            }
            
            if (merge === undefined) {
                const config = await getBranchConfig(state.chapter);
                merge = config.merge === undefined ? true : config.merge;
            }

            const step = await lastStepFrom(state.module, state.chapter);

            if (!step.message.startsWith('chapter-end')) {
                await git.commit(step.message ? `chapter-end: ${step.message}` : 'chapter-end', ['--amend']);
            }

            if (merge) {
                await git.mergeFromTo(state.chapter, state.module);
            }
        },
    },
    summarize: {
        description: 'Creates a summary of a chapter.',
        args: {
            onlyShowOnComplete: {
                description: 'Limit when a user can view the chapter summary.',
                type: 'BOOL',
                named: true,
                optional: true,
            },
        },
        async command({ onlyShowOnComplete }) {
            const state = await getState();

            if (!state.chapter) {
                console.log('You are not currently navigated to a chapter.');
                process.exit(1);
            }

            const last = await lastStepFrom(state.module, state.chapter);

            if (!last.startsWith('chapter-end')) {
                console.log(`Chapter '${state.chapter}' must be finished first. Run 'learnit chapter finish'.`);
                process.exit(1);
            }

            const first = await firstStepFrom(state.module, state.chapter);
            const branch = chapterToBranch(state.module, state.chapter);
            const newBranch = `summary-${branch}`;

            if ((await git.branchLocal()).all.includes(newBranch)) {
                console.log(`Chapter '${state.chapter}' has already been summarized.`);
                process.exit();
            }

            await git.checkoutBranch(newBranch, first.hash);
            await git.mergeFromTo(branch, newBranch);
            await setBranchValue(newBranch, 'require-complete', !!onlyShowOnComplete);
        },
    },
    goto: {
        description: 'Navigates to an existing chapter.',
        args: {
            chapter: {
                description: 'The branch or name of the chapter to navigate to.',
                type: 'STR',
                named: false,
                optional: false,
            },
            module: {
                description: 'The branch or name of the module containing the chapter.',
                type: 'STR',
                named: true,
                hint: '<module>',
                optional: true,
            },
        },
        async command({ module, chapter }) {
            module = module || (await getState()).module;

            const target = (await chapterFrom(module)(chapter));

            if (target) {
                git.checkout(target.value);
            } else {
                console.log(`Unable to find match for '${chapter}'.`);
                process.exit(1);
            }
        },
    },
};
