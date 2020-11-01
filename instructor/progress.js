const fs = require('fs').promises;

const progress = (() => {
    try {
        return require('.progress');
    } catch(e) {
        return {};
    }
})();

const save = async () => fs.writeFile('.progress.json', JSON.stringify(progress), 'utf-8');

const ensure = (mod, chapter) => {
    if (!(mod in progress)) {
        progress[mod] = {};
    }

    if (!(chapter in progress[mod])) {
        progress[mod][chapter] = { completed: false, commit: '' };
    }
};

module.exports = {
    save,
    completed(mod, chapter) {
        ensure(mod, chapter);
        progress[mod][chapter].completed = true;
        return save();
    },
    update(mod, chapter, commit) {
        ensure(mod, chapter);
        progress[mod][chapter].commit = commit;
        return save();
    },
    reset(mod, chapter) {
        ensure(mod, chapter);
        progress[mod][chapter] = { completed: false, commit: '' };
        return save();
    },
    count(mod) {
        return mod in progress
            ? Object.values(progress[mod]).filter(chapter => chapter.completed).length
            : 0;
    },
    current(mod, chapter = null) {
        const module = progress[mod];

        if (!module) {
            return null;
        }

        const chapters = Object.keys(module).sort();

        if (!chapters.length) {
            return null;
        }

        if (!chapter) {
            return chapters.find(chapter => !module[chapter].completed) || null;
        }

        if (!(chapter in module)) {
            return null;
        }

        return module[chapter].commit || null;
    },
};
