const inquirer = require('inquirer');
const { getState } = require('../common/course');
const { unrecognized } = require('../common/errors');
const {
    isExistingModule, isExistingChapter, isExistingStep,
    setBranchValue, getBranchConfig,
    getModule, chapterFrom
} = require('./git-helpers');

const removeCommandFromBranch = async (branch, labelOrCommand) => {
    const config = await getBranchConfig(branch);
    await setBranchValue(branch, 'commands', (config.commands || []).filter((cmd) => {
        return cmd.run !== labelOrCommand && cmd.prefix !== labelOrCommand;
    }));
};

module.exports = {
    description: 'Remove an associated script or command with a point in the course.',
    args: {
        command: {
            description: 'The existing command. Either label or command must be provided.',
            type: 'STR',
            named: true,
            hint: '<command>',
            optional: true,
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
        label: {
            description: 'Label to prepend to command output. Either label or command must be provided.',
            type: 'STR',
            named: true,
            hint: '<label>',
            optional: true,
        }
    },
    async command({ command, module, chapter, step, atCurrent, label }) {
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
                message: 'Are you sure you want to remove a command at the top level of the course?'
            })).value;
            
            if (confirm) {
                await removeCommandFromBranch('main', label || command);
            }

            process.exit();
        }

        if (!await isExistingModule(module)) {
            unrecognized.module(module);
        }

        if (!chapter || atCurrent === 'module') {
            const { value } = await getModule(module);
            await removeCommandFromBranch(value, label || command);
            process.exit();
        }

        if (!await isExistingChapter(module, chapter)) {
            unrecognized.chapter(chapter);
        }

        const { value } = await chapterFrom(module)(chapter);

        if (!step || atCurrent === 'chapter') {
            await removeCommandFromBranch(value, label || command);
            process.exit();
        }

        if (!await isExistingStep(module, chapter, step)) {
            unrecognized.step(step);
        }

        await removeCommandFromBranch(`${value}.${step.replace(/^step: /, '')}`, label || command);
    },
};
