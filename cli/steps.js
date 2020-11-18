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
        async command({ label, module, chapter }) {
            // TODO: default label to current index
            // TODO: pull in current module and chapter
            // TODO: limit adding to only module cwd
            // TODO: create commit
        },
    },
    edit: {
        description: 'Allows for editing of the last committed step.',
        args: {
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
        async command({ module, chapter }) {
            // TODO: pull in current module and chapter
            // TODO:limit adding to only module cwd
            // TODO: amend commit
        },
    },
    // finish: {
    //     description: 'When editing a step, it is necessary to mark the changes as finished to proceed.',
    //     args: {},
    //     async command() {},
    // },
};
