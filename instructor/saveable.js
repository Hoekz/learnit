const fs = require('fs').promises;
const path = require('path');

const directory = process.cwd();

module.exports = class Saveable {
    constructor(name, defaultValue = {}) {
        this.file = path.join(directory, `.${name}.json`);

        try {
            this.value = require(this.file);
        } catch(e) {
            this.value = defaultValue;
        }
    }

    async save() {
        await fs.writeFile(this.file, JSON.stringify(this.value), 'utf-8');
    }
}
