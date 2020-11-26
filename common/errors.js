
const unrecognized = (type, name) => {
    console.error(`Unrecognized ${type} '${name}'.`);
    process.exit(1);
};

unrecognized.module = unrecognized.bind(null, 'module');
unrecognized.chapter = unrecognized.bind(null, 'chapter');
unrecognized.step = unrecognized.bind(null, 'step');
unrecognized.arg = unrecognized.bind(null, 'argument');

const missing = (type, value) => {
    console.error(`Cannot find ${type} matching '${value}'.`);
    process.exit(1);
};

missing.branch = missing.bind(null, 'branch');

module.exports = {
    unrecognized,
    missing,
};
