
const snake = (str) => str.replace(/([A-Z])/g, '-$1').toLowerCase();
const underscore = (str) => str.replace(/([A-Z])/g, '_$1').toLowerCase();

const camel = (str) => str.replace(/((-|_)[a-z])/g, c => c[1].toUpperCase());

module.exports = { snake, camel, underscore };
