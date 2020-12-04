const simpleGit = require('simple-git');
const { getState } = require('../common/course');
const { getBranchConfig } = require('./git-helpers');

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

            await git.commit(`save: ${message || (new Date()).toLocaleString()}`, [cwd || '.']);
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
        },
        async command({ to }) {
            // TODO: implement upload
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
};
