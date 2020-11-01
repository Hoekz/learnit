const fs = require('fs').promises;

const settings = (() => {
    try {
        return require('.settings');
    } catch(e) {
        return {};
    }
})();

const save = async () => fs.writeFile('.settings.json', JSON.stringify(settings), 'utf-8');

module.exports = {
    save,
    get(key) {
        return settings[key];
    },
    set(key, value) {
        settings[key] = value;
        return save();
    }
};
