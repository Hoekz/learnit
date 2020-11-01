const inquirer = require('inquirer');
const course = require('./course');
const navigate = require('./navigate');

const prompt = (description, options) => {
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

    return (await prompt('Welcome to the course!', {
        message: 'Choose a Module',
        choices: modules,
    })).value;
};

const chooseChapter = async (module) => {
    const chapters = await course.getChapters(module);

    return (await prompt(module), {
        message: 'Choose a Chapter',
        choices: chapters,
    }).value;
};

const navigateChapter = async () => {
    const choices = [{
        key: '0',
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

    return (await prompt(scriptLines), { message: '', choices }).value;
};

module.exports = { chooseModule, chooseChapter, navigateChapter };
