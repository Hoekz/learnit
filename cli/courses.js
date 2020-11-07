const path = require('path');
const simpleGit = require('simple-git');
const { getState, isGitRepo } = require('../common/course');

const git = simpleGit();

module.exports = {
    create: {
        description: 'Initializes a course. If you are already in a git repo, it will be used.',
        args: {},
        async command() {
            const dir = path.basename(process.cwd());
            if (await isGitRepo()) {
                console.log(`A repo already exists in ${dir}.`);
            } else {
                console.log(`No repo detected, creating a course repo in ${dir}.`);

                try {
                    await git.init();
                } catch (e) {
                    console.log('Unable to create repo:');
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
                hint: '[true]',
                optional: true,
            },
        },
        command({ modules, onlyShowOnComplete }) {}
    }
};
