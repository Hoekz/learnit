require('colors');
const inquirer = require('inquirer');

const course = require('../common/course');
const { read } = require('../common/script');
const settings = require('../common/settings');

const navigate = require('./navigate');

const { getModule, chapterFrom } = require('../cli/git-helpers');
const { mapCourse } = require('../common/course');

function locationString({ course, module, chapter, step, commit }) {
    return ` ${[course, module, chapter, step, commit].filter(e => e).join(' > ')} `;
}

function format(desc, showSymbols, columns = 80) {
    const rules = [
        [/(\[[^\]]*\])\([^\)]+\)/gi, (full, target) => showSymbols ? full.cyan : target.cyan],
        [/([^_])_([^_]+)_/g, (full, lead, target) => showSymbols ? full.italic : lead + target.italic],
        [/([^*])\*([^*]+)\*/g, (full, lead, target) => showSymbols ? full.italic : lead + target.italic],
        [/__([^_]+)__/g, (full, target) => showSymbols ? full.bold : target.bold],
        [/\*\*([^*]+)\*\*/g, (full, target) => showSymbols ? full.bold : target.bold],
        [/`([^`]+)`/g, (full, target) => showSymbols ? full.green : target.green],
    ];

    const lines = rules.reduce((str, [pattern, sub]) => str.replace(pattern, sub), desc).split('\n');

    return lines.reduce((output, line) => {
        let lastLine = output.pop();

        if (line.trim().startsWith('-')) {
            output.push(...(lastLine ? [lastLine, line] : [line]));
        } else if (line === '') {
            output.push(lastLine, '', '');
        } else {
            line.split(/(\s+)/g).forEach((wordOrSpace) => {
                const len = (lastLine + wordOrSpace).strip.length;

                if (/\s+/.test(wordOrSpace)) {
                    if (len < columns) {
                        lastLine += wordOrSpace;
                    } else {
                        output.push(lastLine);
                        lastLine = '';
                    }
                } else {
                    if (len < columns) {
                        if (/\s+$/.test(lastLine) || !lastLine) {
                            lastLine += wordOrSpace;
                        } else {
                            lastLine += ' ' + wordOrSpace;
                        }
                    } else {
                        output.push(lastLine);
                        lastLine = wordOrSpace;
                    }
                }
            });

            if (lastLine) {
                output.push(lastLine);
            }
        }

        return output;
    }, ['']).join('\n');
}

const quit = {
    name: 'Quit',
    value: 'quit',
};

const prompt = async (description, options) => {
    if (!options.choices.length) {
        console.log(description.length > 40 ? description.substr(0, 37) + '...' : description, 'has no choices');
        return { value: null };
    }

    const state = await course.getState();
    const columns = process.stdout.columns || 80;

    console.clear();
    console.log((locationString(state) + ' '.repeat(columns)).substr(0, columns).bgWhite.black);

    if (description) {
        const markdownActive = (await settings.get('markdown.active')) === 'true';
        const markdownSymbols = (await settings.get('markdown.symbols')) === 'true';

        console.log(`\n${markdownActive ? format(description, markdownSymbols, columns) : description}\n`);
    }

    const { value } = await inquirer.prompt({
        type: 'list',
        name: 'value',
        ...options,
    });

    if (value === 'quit') {
        process.exit();
    }

    return value;
};

const chooseModule = async () => {
    const modules = await course.getModules();

    if (!modules.length) {
        console.log('There are no modules in this course, exiting.');
        return null;
    }

    return await prompt('Welcome to the course!', {
        message: 'Choose a Module',
        choices: [...modules, new inquirer.Separator(), quit],
    });
};

const chooseChapter = async (module) => {
    const detailedModule = await getModule(module);
    const script = await read(detailedModule);
    const chapters = await course.getChapters(module);

    return await prompt(script.description, {
        message: chapters.length ? 'Choose a Chapter' : 'There are no chapters in this module.',
        choices: [...chapters, new inquirer.Separator(), { name: 'Back to Module List', value: 'back' }, quit],
    });
};                    

const navigateChapter = async ({ module, chapter, step, commit }) => {
    const detailedModule = await getModule(module);
    const detailedChapter = await chapterFrom(module)(chapter);
    const script = await read(detailedModule);
    const scriptChapter = script.chapters.find(c => {
        if (/^\d+$/.test(chapter)) {
            return c.name.endsWith(chapter);
        }

        return c.name.trim().toLowerCase() === chapter.trim().toLowerCase();
    });

    const choices = [new inquirer.Separator(), {
        name: 'Back to Chapter List',
        value: 'back',
    }, quit];

    if (!step) {
        if (!detailedChapter.steps.length) {
            return await prompt(scriptChapter.description, {
                message: 'There is no content in this chapter.',
                choices,
            });
        }

        return await prompt(scriptChapter.description, {
            message: 'Would you like to read this chapter?',
            choices: [{ name: 'Start Chapter', value: 'start' }, ...choices],
        });
    }

    if (!(await navigate.isFirstStep())) {
        choices.unshift({ name: 'Previous Step', value: 'prev' });
    }

    if (!(await navigate.isLastStep())) {
        choices.unshift({ name: 'Next Step', value: 'next' });
    }

    const message = choices.length === 3 ? 'There is no other content in this chapter.' : 'Go to:';
    const warning = '\t`WARNING: no matching step found in script.`';

    const scriptSteps = scriptChapter.steps.filter(s => s.name === step);

    if (scriptSteps.length === 1) {
        return await prompt(scriptSteps[0].description, { message, choices });
    } else if (scriptSteps.length === 0) {
        return await prompt(warning, { message, choices });
    } else {
        const matchingCommits = detailedChapter.steps.filter(c => c.message.replace('step: ', '') === step);
        const trueStepIndex = matchingCommits.findIndex(c => c.hash === commit);

        return await prompt(scriptSteps[trueStepIndex] ? scriptSteps[trueStepIndex].description : warning, { message, choices });
    }
};

module.exports = { chooseModule, chooseChapter, navigateChapter };
