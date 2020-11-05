
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
        reloadOnStep: {
            description: 'Indicate that the command should be restarted when the user navigates to a new step.',
            type: 'BOOL',
            named: true,
            hint: '[false]',
            optional: true,
        }
    },
    command({ command, module, chapter, step, reloadOnStep }) {},
};
