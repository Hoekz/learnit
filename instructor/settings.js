const Saveable = require('../common/saveable');

const settings = new Saveable('settings');

module.exports = {
    save: settings.save,
    get(key) {
        return settings.value[key];
    },
    set(key, value) {
        settings.value[key] = value;
        return settings.save();
    }
};
