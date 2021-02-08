const path = require('path');
const simpleGit = require('simple-git');
const { getState } = require('../common/course');
const settings = require('../common/settings');
const { getBranchConfig, chapterFrom, getModule, setBranchValue } = require('./git-helpers');

const courses = require('./courses');
const modules = require('./modules');
const chapters = require('./chapters');
const { isGitRepo, rootDirectory } = require('../common/git-fs');

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

            const root = await rootDirectory();

            if (cwd) {
                await git.add(path.join(root, cwd));
            } else {
                await git.add(root);
            }

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

            const baseArgs = ['-u', 'origin', '--all'];
            await git.push(soft ? baseArgs : [...baseArgs, '--force-with-lease']);
        }
    },
    download: {
        description: 'Download the latest version of a course.',
        args: {
            from: {
                description: 'Remote location to pull the repository from. Only necessary when downloading for the first time.',
                type: 'STR',
                named: false,
                optional: true,
            },
        },
        async command({ from }) {
            if (await isGitRepo()) {
                if (from) {
                    console.error('You are already inside a repository. If you are downloading a new course, use a different directory.');
                    console.error('If you are trying to retrieve the latest version, run `learnit download`.');
                    process.exit(1);
                }

                console.log('Fetching latest version...');
                const { branches } = await git.fetch();

                for (const { name } of branches) {
                    console.log(`Updating ${name}...`);
                    await git.mergeFromTo(`origin/${name}`, name, ['--ff-only']);
                }

                console.log('Download complete.');
                process.exit();
            }

            if (from) {
                console.log(await git.clone(from));
            }
        },
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
        main: courses.goto,
        module: modules.goto,
        chapter: chapters.goto,
    },
    config: {
        description: 'Shows the configuration of the current branch.',
        args: {},
        async command() {
            const { module, chapter } = await getState();

            if (!module) {
                printConfig('course', await getBranchConfig('main'));
                process.exit();
            }

            const branch = (await (chapter ? chapterFrom(module)(chapter) : getModule(module))).value;
            printConfig(chapter || module, await getBranchConfig(branch));
        },
    },
    settings: {
        description: 'Edit the settings of the course such as styling and stepping.',
        args: {
            key: {
                description: 'Settings key to view or set.',
                type: 'STR',
                named: false,
                optional: true,
            },
            value: {
                description: 'Value to set key to.',
                type: 'STR',
                named: false,
                optional: true,
            },
        },
        async command({ key, value }) {
            if (!key) {
                await settings.interactive();

                process.exit();
            }

            if (!value) {
                console.log(await settings.get(key));
                process.exit();
            }

            await settings.set(key, value);
        },
    },
};

function printConfig(title, config) {
    console.log(`Config values for ${title}:`);
    Object.entries(config).forEach(([key, value]) => console.log(`\t${key}: ${JSON.stringify(value)}`));
}
