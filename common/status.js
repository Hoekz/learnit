const fs = require('fs');
const path = require('path');
const gitFs = require('./git-fs');

module.exports = {
    async connect(name) {
        const directory = await gitFs.rootDirectory();

        const file = path.join(directory, `.learnit/${name}`);

        fs.writeFileSync(file, 'on', 'utf8');

        process.on('exit', () => fs.writeFileSync(file, 'off'));
    },
    async check(name) {
        try {
            const value = await gitFs.readFile(`.learnit/${name}`, 'utf8');
            return value.trim() === 'on';
        } catch(e) {
            return false;
        }
    }
};
