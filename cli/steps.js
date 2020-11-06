const { getState } = require('../common/course');

module.exports = {
    create: {
        description: 'Create a new step in a chapter.',
        args: {
            label: {
                description: 'An optional label for the step.',
                type: 'STR',
                named: false,
                optional: true,
            },
            module: {
                description: 'The module in which to create the step.',
                type: 'STR',
                named: true,
                hint: '<module_branch_or_name>',
                optional: true,
            },
            chapter: {
                description: 'The chapter in which to create the step.',
                type: 'STR',
                named: true,
                hint: '<chapter_branch_or_name>',
                optional: true,
            },
        },
        command({ label, module, chapter }) {},
    },
    edit: {
        description: 'Allows for editing of a previously committed step.',
        args: {
            labelOrIndex: {
                description: 'The label or index of the step to edit.',
                type: 'STR',
                named: false,
                optional: true,
            },
            module: {
                description: 'The module in which to edit the step.',
                type: 'STR',
                named: true,
                hint: '<module_branch_or_name>',
                optional: true,
            },
            chapter: {
                description: 'The chapter in which to edit the step.',
                type: 'STR',
                named: true,
                hint: '<chapter_branch_or_name>',
                optional: true,
            },
        },
        command({ labelOrIndex, module, chapter }) {},
    },
    finish: {
        description: 'When editing a step, it is necessary to mark the changes as finished to proceed.',
        args: {},
        command() {},
    },
};
