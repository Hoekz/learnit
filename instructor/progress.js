const Saveable = require('../common/saveable');

const progress = new Saveable('progress');

const ensure = (mod, chapter) => {
    if (!(mod in progress.value)) {
        progress.value[mod] = {};
    }

    if (!(chapter in progress.value[mod])) {
        progress.value[mod][chapter] = { completed: false, commit: '' };
    }
};

module.exports = {
    completed(mod, chapter) {
        ensure(mod, chapter);
        progress.value[mod][chapter].completed = true;
        return progress.save();
    },
    update(mod, chapter, commit) {
        ensure(mod, chapter);
        progress.value[mod][chapter].commit = commit;
        return progress.save();
    },
    reset(mod, chapter) {
        ensure(mod, chapter);
        progress.value[mod][chapter] = { completed: false, commit: '' };
        return progress.save();
    },
    count(mod) {
        return mod in progress.value
            ? Object.values(progress.value[mod]).filter(chapter => chapter.completed).length
            : 0;
    },
    current(mod, chapter = null) {
        const module = progress.value[mod];

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
