const path = require('path');
const git = require('../common/git');
const { mapCourse, getState } = require('../common/course');
const { unrecognized, missing } = require('../common/errors');
const { chapterToBranch } = require('../common/utils');
const { isExistingModule, getModule, setBranchValue, saveConfig } = require('./git-helpers');
const gitFs = require('../common/git-fs');

const toIgnore = `
# Learn It directory
.learnit/
`;

const writeGitIgnore = (content) => gitFs.writeFile('.gitignore', content, 'utf-8');

const ensureGitIgnore = async () => {
    try {
        await gitFs.access('.gitignore');
        const ignore = (await gitFs.readFile('.gitignore', 'utf-8')).toString().split('\n');

        if (!ignore.includes('.learnit')) {
            await writeGitIgnore(ignore.join('\n') + toIgnore);
        }
    } catch (e) {
        await writeGitIgnore(toIgnore);
    }
};

const ensureMain = async () => {
    const { all } = await git.branchLocal();
    if (all.includes('master') && !all.includes('main')) {
        console.log('Renaming master to main...');
        await git.branch(['-m', 'master', 'main']);
    } else if (!all.includes('main') && !all.includes('master')) {
        console.log('No master or main branch found, creating main...');
        await git.raw(['checkout', '-b', 'main']);
    }

    try {
        await git.checkout('main');
    } catch(e) {
        // no catch needed, only happens when the repo is empty.
    }
}

module.exports = {
    create: {
        description: 'Initializes a course. If you are already in a git repo, it will be used.',
        args: {},
        async command() {
            const dir = path.basename(process.cwd());
            if (await gitFs.isGitRepo()) {
                console.log(`A repo already exists in ${dir}, checking .gitignore...`);
                await ensureMain();
                await ensureGitIgnore();
            } else {
                console.log(`No repo detected, creating a course repo in ${dir}.`);

                try {
                    await git.init();
                    await ensureGitIgnore();
                    const root = await gitFs.rootDirectory();
                    await git.add(root);
                    await git.commit('initial commit', []);
                    await git.branch(['-m', 'master', 'main']);
                } catch (e) {
                    console.log('Unable to fully create repo:');
                    console.log(e);
                    process.exit(1);
                }
            }
        },
    },
    summarize: {
        description: 'Creates a summary of the course.',
        args: {
            modules: {
                description: 'List of modules to summarize.',
                type: 'STR[]',
                named: true,
                hint: '<m1>,<m2>',
                optional: true,
            },
            onlyShowOnComplete: {
                description: 'Whether to allow the user to select the summary before course is completed.',
                type: 'BOOL',
                named: true,
                optional: true,
            },
        },
        async command({ modules, onlyShowOnComplete }) {
            const course = await mapCourse();
            const moduleBranchesInCourse = course.map(entry => entry.value);

            modules = modules || moduleBranchesInCourse;

            for (const module of modules) {
                if (!(await isExistingModule(module))) {
                    unrecognized.module(module);
                }
            }

            const toMerge = await Promise.all(modules.map(getModule));

            for (const module of toMerge) {
                if (!(await isExistingBranch(chapterToBranch(module.value, 'summary')))) {
                    missing.branch(chapterToBranch(module, 'summary'));
                }
            }

            const newBranch = 'summary';
            await git.checkoutBranch(newBranch, 'main');

            for (const module of toMerge) {
                await git.mergeFromTo(chapterToBranch(module.value, 'summary'), newBranch);
            }

            await setBranchValue(newBranch, 'require-complete', !!onlyShowOnComplete);
        }
    },
    goto: {
        description: 'Navigates back to the start (main branch) of the course.',
        args: {},
        async command() {
            await git.checkout('main');
            await getState();
        }
    },
    lock: {
        description: 'Locks further development of the course and prepares the course for download.',
        args: {},
        async command() {
            await setBranchValue('main', 'locked', true);
            await saveConfig();
            await setBranchValue('main', 'locked', false);
            await git.add('learnit.config.json');
            await git.commit('lock: course locked.');
            await git.raw('update-index', '--skip-worktree', 'learnit.config.json');
        },
    },
    unlock: {
        description: 'Unlocks the course for further development.',
        args: {},
        async command() {
            await setBranchValue('main', 'locked', false);
            await git.raw('update-index', '--no-skip-worktree', 'learnit.config.json');
            console.log('Course is unlocked.');
        },
    },
};
