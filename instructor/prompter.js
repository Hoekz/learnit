const inquirer = require('inquirer');
const course = require('../common/course');
const navigate = require('./navigate');

const prompt = (description, options) => {
    if (!options.choices.length) {
        console.log(description, 'has no choices');
        return { value: null };
    }

    console.clear();

    if (description instanceof Array) {
        description.forEach(line => console.log(line));
    } else {
        console.log(description);
    }

    return inquirer.prompt({
        type: 'list',
        name: 'value',
        ...options,
    });
};

const chooseModule = async () => {
    const modules = await course.getModules();

    if (!modules.length) {
        console.log('There are no modules in this course, exiting.');
        return null;
    }

    return (await prompt('Welcome to the course!', {
        message: 'Choose a Module',
        choices: modules,
    })).value;
};

const chooseChapter = async (module) => {
    const chapters = await course.getChapters(module);

    return (await prompt(module, {
        message: chapters.length ? 'Choose a Chapter' : 'There are no chapters in this module.',
        choices: [...chapters, { key: 'b', name: 'Back to Modules', value: 'back' }],
    })).value;
};

const navigateChapter = async () => {
    const choices = [{
        key: 'b',
        name: 'Back to Chapters',
        value: 'back',
    }];

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

    const scriptLines = [];

    return (await prompt(scriptLines, { message: '', choices })).value;
};

module.exports = { chooseModule, chooseChapter, navigateChapter };
