require('colors');
const inquirer = require('inquirer');
const course = require('../common/course');
const navigate = require('./navigate');

const { read } = require('../common/script');
const { getModule, chapterFrom } = require('../cli/git-helpers');

function locationString({ course, module, chapter, step }) {
    return ` ${[course, module, chapter, step].filter(e => e).join(' > ')} `;
}

function format(desc) {
    const rules = [
        [/[^_]_[^_]+_/g, str => str.italic],
        [/[^*]\*[^*]+\*/g, str => str.italic],
        [/__[^_]+__/g, str => str.bold],
        [/\*\*[^*]+\*\*/g, str => str.bold],
        [/`[^`]+`/g, str => str.green],
    ];

    return rules.reduce((str, [pattern, sub]) => str.replace(pattern, sub), desc);
}

const quit = {
    name: 'Quit',
    value: 'quit',
};

const prompt = async (description, options) => {
    if (!options.choices.length) {
        console.log(description, 'has no choices');
        return { value: null };
    }

    const state = await course.getState();

    console.clear();
    console.log(locationString(state).bgWhite.black);

    if (description) {
        console.log(format(description));
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

const navigateChapter = async ({ module, chapter, step }) => {
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
        choices.unshift({
            key: '2',
            name: 'Previous Step',
            value: 'prev',
        });
    }

    if (!(await navigate.isLastStep())) {
        choices.unshift({
            key: '1',
            name: 'Next Step',
            value: 'next',
        });
    }

    const scriptStep = scriptChapter.steps.find(s => s.name === step);

    const message = choices.length === 3 ? 'There is no content in this chapter.' : 'Go to:';

    return await prompt(scriptStep.description, { message, choices });
};

module.exports = { chooseModule, chooseChapter, navigateChapter };
