const inquirer = require('inquirer');

async function scriptFor(target) {
    const { value } = await inquirer.prompt({
        type: 'editor',
        name: 'value',
        message: `Provide a short description for ${target}.`,
        validate(text) {
            return text.length ? true : 'A description must be provided.';
        },
    });

    return value;
}

module.exports = {
    scriptFor,
};
