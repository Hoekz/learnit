const fs = require('fs');
const path = require('path');
const gitFs = require('./git-fs');

const ensureLearnitDir = () => {
    if (ensureLearnitDir.promise) {
        return ensureLearnitDir.promise;
    }
    
    return ensureLearnitDir.promise = gitFs.mkdir('.learnit').catch(e => e);
};

module.exports = {
    async connect(name) {        
        await ensureLearnitDir();
        await gitFs.writeFile(`.learnit/${name}`, 'on', 'utf8');

        const directory = await gitFs.rootDirectory();
        const file = path.join(directory, `.learnit/${name}`);

        const turnOff = () => {
            fs.writeFileSync(file, 'off');
            process.exit();
        };

        process.on('SIGTERM', turnOff);
        process.on('SIGINT', turnOff);
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
