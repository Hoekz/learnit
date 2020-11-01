const simpleGit = require('simple-git');
const git = simpleGit();

const getBranches = async (prefix, describe = identity) => {
    const branches = await git.branch(['--list', `${prefix}-*`]);
    const config = await git.listConfig();

    return branches.all.slice().sort().map((branch, index) => ({
        key: index < 10 ? (index + 1).toString().split('').pop() : null,
        value: branch,
        name: config.values['.git/config'][`branch.${branch}.description`] || describe(branch),
    }));
};

const getCommits = async (from, to) => {
    const logs = await git.log({ from, to });
    return logs.all;
};

const readable = (prefix) => (branch) => (branch
    .replace(prefix, '')
    .split('-')
    .map(word => word[0].toUpperCase() + word.substr(1))
    .join(' ')
);

const getModules = () => getBranches('module', readable('module-'));
const getChapters = (module) => getBranches(`${module}-chapter`, readable(`${module}-chapter-`));
const getSteps = async (module, chapter) => {
    const commits = await getCommits(`module-${module}`, `${module}-chapter-${chapter}`);
    const start = commits.findIndex(commit => commit.message.startsWith('chapter-start'));
    const end = commits.findIndex(commit => commit.message.startsWith('chapter-end'));

    return commits.slice(end, start + 1).reverse();
};

const getState = async () => {
    const { current } = await git.status();
    const config = await git.listConfig();

    if (current === 'master') {
        return { module: null, chapter: null, commit: null };
    }

    if (current.startsWith('module-')) {
        return {
            module: config.values['.git/config'][`branch.${current}.description`] || readable('module-')(current),
            chapter: null,
            commit: null,
        };
    }

    if (current.includes('-chapter-')) {
        const module = `module-${current.replace(/-chapter-.*$/, '')}`;
        const chapter = current.replace(/^.*-chapter-/, '');

        const { latest } = await git.log(['-n', '1']);

        return {
            module: config.values['.git/config'][`branch.${module}.description`] || readable('module-')(module),
            chapter: config.values['.git/config'][`branch.${current}.description`] || readable('module-')(chapter),
            commit: latest.hash,
        };
    }

    return { module: null, chapter: null, commit: null };
};

module.exports = { getModules, getChapters, getSteps, getState };
