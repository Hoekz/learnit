const { command } = require("../cli/create-command");

module.exports = {
    description: 'Runs and concats all commands setup to run in the repo.',
    args: {
        delta: {
            description: 'Attaches a listener to output the commit delta on navigation changes.',
            type: 'BOOL',
            named: true,
            optional: true,
        },
        noDelta: {
            description: 'Attaches a listener to output from instructor set commands only.',
            type: 'BOOL',
            named: true,
            optional: true,
        },
    },
    async command({ delta, noDelta }) {

    },
};
