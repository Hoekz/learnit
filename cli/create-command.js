const inquirer = require('inquirer');
const { getState } = require('../common/course');
const { unrecognized } = require('../common/errors');
const {
    isExistingModule, isExistingChapter, isExistingStep,
    setBranchValue, getBranchConfig,
    getModule, chapterFrom
} = require('./git-helpers');

const addCommandToBranch = async (branch, command, reloadOnStep, cwd, label, silent, once) => {
    const config = await getBranchConfig(branch);
    await setBranchValue(branch, 'commands', [...(config.commands || []), {
        run: command,
        refresh: !!reloadOnStep,
        cwd: cwd || config.cwd || '',
        prefix: label,
        silent,
        once,
    }]);
};

module.exports = {
    description: 'Associate a script or command with a point in the course.',
    args: {
        command: {
            description: 'The command to be run.',
            type: 'STR',
            named: false,
            optional: false,
        },
        module: {
            description: 'The module for which to run the command.',
            type: 'STR',
            named: true,
            hint: '<module>',
            optional: true,
        },
        chapter: {
            description: 'The chapter for which to run the command.',
            type: 'STR',
            named: true,
            hint: '<chapter>',
            optional: true,
        },
        step: {
            description: 'The step for which to run the command.',
            type: 'STR',
            named: true,
            hint: '<step>',
            optional: true,
        },
        atCurrent: {
            description: 'Instead of explicitly listing out location, use current location in the course for when to run command.',
            type: 'STR',
            named: true,
            hint: `<'module'|'chapter'|'step'>`,
            optional: true,
        },
        reloadOnStep: {
            description: 'Indicate that the command should be restarted when the user navigates to a new step.',
            type: 'BOOL',
            named: true,
            optional: true,
        },
        cwd: {
            description: 'Directory in which to run the command. Defaults to project directory.',
            type: 'STR',
            named: true,
            hint: '<directory>',
            optional: true,
        },
        label: {
            description: 'Label to prepend to command output.',
            type: 'STR',
            named: true,
            hint: '<label>',
            optional: true,
        },
        silent: {
            description: 'Indicate that the command should run silently.',
            type: 'BOOL',
            named: true,
            optional: true,
        },
        once: {
            description: 'Indicate that the command only needs to run once.',
            type: 'BOOL',
            named: true,
            optional: true,
        },
    },
    async command({ command, module, chapter, step, atCurrent, reloadOnStep, cwd, label, silent, once }) {
        if (atCurrent) {
            state = await getState();
            module = state.module;
            chapter = state.chapter;
            step = state.step;
        }
        
        if (!module) {
            const confirm = (await inquirer.prompt({
                type: 'confirm',
                name: 'value',
                default: false,
                message: 'Are you sure you want to create a command at the top level of the course?'
            })).value;
            
            if (confirm) {
                await addCommandToBranch('main', command, reloadOnStep, cwd, label, silent, once);
            }

            process.exit();
        }

        if (!await isExistingModule(module)) {
            unrecognized.module(module);
        }

        if (!chapter || atCurrent === 'module') {
            const { value } = await getModule(module);
            await addCommandToBranch(value, command, reloadOnStep, cwd, label, silent, once);
            process.exit();
        }

        if (!await isExistingChapter(module, chapter)) {
            unrecognized.chapter(chapter);
        }

        const moduleConfig = await getBranchConfig.module(module);
        const { value } = await chapterFrom(module)(chapter);

        if (!step || atCurrent === 'chapter') {
            await addCommandToBranch(value, command, reloadOnStep, cwd || moduleConfig.cwd, label, silent, once);
            process.exit();
        }

        if (!await isExistingStep(module, chapter, step)) {
            unrecognized.step(step);
        }

        await addCommandToBranch(`${value}.${step}`, command, false, cwd || moduleConfig.cwd, label, silent, once);
    },
};
