const fs = require('fs').promises;
const path = require('path');
const simpleGit = require('simple-git');
const { mapCourse, isGitRepo } = require('../common/course');

const git = simpleGit();

const toIgnore = `
# Learn It directory
.learnit/
`;

const writeGitIgnore = (content) => fs.writeFile('.gitignore', content, 'utf-8');

const ensureGitIgnore = async () => {
    try {
        await fs.access('.gitignore');
        const ignore = (await fs.readFile('.gitignore', 'utf-8')).toString().split('\n');

        if (!ignore.includes('.learnit')) {
            await writeGitIgnore(ignore.join('\n') + toIgnore);
        }
    } catch (e) {
        await writeGitIgnore(toIgnore);
    }
};

module.exports = {
    create: {
        description: 'Initializes a course. If you are already in a git repo, it will be used.',
        args: {},
        async command() {
            const dir = path.basename(process.cwd());
            if (await isGitRepo()) {
                console.log(`A repo already exists in ${dir}, checking .gitignore...`);
                await ensureGitIgnore();
            } else {
                console.log(`No repo detected, creating a course repo in ${dir}.`);

                try {
                    await git.init();
                    await ensureGitIgnore();
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
            const moduleNamesInCourse = course.map(entry => entry.name);

            modules = modules || moduleBranchesInCourse;

            for (const module of modules) {
                if (!moduleBranchesInCourse.includes(module) && !moduleNamesInCourse.includes(module)) {
                    console.log(`Unrecognized module '${module}'. Either use the branch name or title of the module.`);
                    process.exit();
                }
            }

            // TODO: confirm all modules listed have a summary
            // TODO: merge all modules listed into branch
            // TODO: add show on complete flag if necessary
        }
    }
};
