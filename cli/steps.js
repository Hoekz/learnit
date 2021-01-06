const simpleGit = require('simple-git');
const { getState } = require('../common/course');
const { unrecognized } = require('../common/errors');
const { chapterFrom, isExistingModule, isExistingChapter, getBranchConfig } = require('./git-helpers');

const git = simpleGit();

async function save(message, cwd) {
    await git.add(cwd || process.cwd());
    await git.commit(`save: ${message || (new Date()).toLocaleString()}`, []);
}

module.exports = {
    create: {
        description: 'Create a new step in a chapter.',
        args: {
            label: {
                description: 'An optional label for the step.',
                type: 'STR',
                named: false,
                optional: true,
            },
            module: {
                description: 'The module in which to create the step.',
                type: 'STR',
                named: true,
                hint: '<module_branch_or_name>',
                optional: true,
            },
            chapter: {
                description: 'The chapter in which to create the step.',
                type: 'STR',
                named: true,
                hint: '<chapter_branch_or_name>',
                optional: true,
            },
        },
        async command({ label, module, chapter }) {
            const state = await getState();
            module = module || state.module;
            chapter = chapter || state.chapter;

            if (!await isExistingModule(module)) {
                unrecognized.module(module);
            }

            if (!await isExistingChapter(module, chapter)) {
                unrecognized.chapter(chapter);
            }

            label = label || (await chapterFrom(module)(chapter).steps.length);

            const { cwd } = await getBranchConfig.module(module);

            await save(label, cwd);
        },
    },
    update: {
        description: 'Allows for updating of the last committed step or save point.',
        args: {},
        async command() {
            const { module, chapter } = await getState();

            if (!chapter) {
                console.error('You must be navigated to a chapter to update the last step.');
                process.exit(1);
            }

            const { cwd } = await getBranchConfig.module(module);

            await git.add([cwd || '.']);
            await git.raw(['commit', '--amend', '--no-edit']);
        },
    },
    revert: {
        description: 'Allows for reverting the previously committed step.',
        args: {
            soft: {
                description: 'Undo the saving of the step, but not the content.',
                type: 'BOOL',
                named: true,
                optional: true,
            }
        },
        async command({ soft }) {
            const { step } = await getState();

            if (!step) {
                console.error('You must be navigated to a step to revert it.');
                process.exit(1);
            }

            await git.reset(soft ? 'soft' : 'hard', ['HEAD~1']);
        },
    }
};
