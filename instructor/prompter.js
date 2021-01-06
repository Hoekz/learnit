require('colors');
const inquirer = require('inquirer');
const course = require('../common/course');
const navigate = require('./navigate');

function locationString({ course, module, chapter, step }) {
    return ` ${[course, module, chapter, step].filter(e => e).join(' >  ')} `;
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

    if (description instanceof Array) {
        description.forEach(line => console.log(line));
    } else {
        console.log(description);
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
    const chapters = await course.getChapters(module);

    return await prompt(module, {
        message: chapters.length ? 'Choose a Chapter' : 'There are no chapters in this module.',
        choices: [...chapters, new inquirer.Separator(), { name: 'Back to Modules', value: 'back' }, quit],
    });
};

const navigateChapter = async () => {
    const choices = [new inquirer.Separator(), {
        name: 'Back to Chapters',
        value: 'back',
    }, quit];

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

    const message = choices.length === 3 ? 'There is no content in this chapter.' : '';
    const scriptLines = [];

    return await prompt(scriptLines, { message, choices });
};

module.exports = { chooseModule, chooseChapter, navigateChapter };
