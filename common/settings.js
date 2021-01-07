const inquirer = require('inquirer');
const { getBranchConfig, setBranchValue } = require('../cli/git-helpers');

const courseSettings = {
    'diffs.staged': {
        description: 'Checkout diffs as staged changes rather than just diff between commits.',
        values: ['true', 'false'],
        default: 'false',
    },
    'markdown.active': {
        description: 'Whether or not to format script as markdown.',
        values: ['true', 'false'],
        default: 'true',
    },
    'markdown.symbols': {
        description: 'When rendering markdown, leave symbols such as _, *, or ~ present.',
        values: ['true', 'false'],
        default: 'false',
    },
};

async function get(key) {
    if (!(key in courseSettings)) {
        console.log(`Invalid settings key '${key}'.`);
        process.exit(1);
    }

    const config = await getBranchConfig('main');
    return config[key] || courseSettings[key].default;
}

async function set(key, value) {
    if (!(key in courseSettings)) {
        console.log(`Invalid settings key '${key}'.`);
        process.exit(1);
    }

    if (!courseSettings[key].values.includes(value)) {
        console.log(`Invalid value for key '${key}', must be one of: ${courseSettings[key].values.join(', ')}`);
        process.exit(1);
    }

    await setBranchValue('main', key, value);
}

async function interactive() {
    console.log('Running interactive settings...\n');
    for (const [key, setting] of Object.entries(courseSettings)) {
        console.log(setting.description);
        const { value } = await inquirer.prompt({
            message: key,
            type: 'list',
            name: 'value',
            default: setting.default,
            choices: setting.values,
        });
        await setBranchValue('main', key, value);
    }
}

module.exports = {
    interactive, set, get,
};
