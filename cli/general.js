const simpleGit = require('simple-git');
const { getState } = require('../common/course');
const { getBranchConfig } = require('./git-helpers');

const courses = require('./courses');
const modules = require('./modules');
const chapters = require('./chapters');

const git = simpleGit();

module.exports = {
    save: {
        description: 'Save current progress on the course, a module, or a chapter.',
        args: {
            message: {
                description: 'Details about this save point.',
                type: 'STR',
                named: false,
                optional: true,
            },
        },
        async command({ message }) {
            const { module } = await getState();

            const { cwd } = module ? await getBranchConfig.module(module) : {};

            await git.add(cwd || process.cwd());
            await git.commit(`save: ${message || (new Date()).toLocaleString()}`, []);
        }
    },
    upload: {
        description: 'Upload current course to a remote location.',
        args: {
            to: {
                description: 'Remote location that repository will be pushed to. Only need to set once.',
                type: 'STR',
                named: false,
                optional: true,
            },
            soft: {
                description: 'Removes the --force-with-lease flag.',
                type: 'BOOL',
                named: true,
                optional: true,
            }
        },
        async command({ to, soft }) {
            const remotes = await git.getRemotes();
            const hasOrigin = remotes.some(r => r.name === 'origin');

            if (!hasOrigin && !to) {
                console.error(`You have not specified an origin. Provide a remote url using 'learnit upload <url>'. This is only required once.`);
                process.exit(1);
            }

            if (!hasOrigin) {
                await git.addRemote('origin', to);
            }

            await git.push(soft ? null : ['--force-with-lease']);
        }
    },
    rebase: {
        description: 'Recursively rebase all dependent branches.',
        args: {
            module: {
                description: 'Module to perform rebase in. Defaults to either current module or entire course.',
                type: 'STR',
                named: true,
                optional: true,
            },
        },
        async command({ module }) {
            // TODO: implement rebase
        }
    },
    goto: {
        home: courses.goto,
        module: modules.goto,
        chapter: chapters.goto,
    },
};
