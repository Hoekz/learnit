# Learn It

Idea: use version control to learn a topic.

## Installing

 - `npm install -g learnit`

## Course Structure

The structure of a course must currently follow this basic Layout:

```
Course
|-- Module 1
  |-- Chapter 01
    |-- Step 01
    |-- Step 02
  |-- Chapter 02
  |-- Summary
|-- Module 2
```

In reality, `Course` represents the `master` branch of a git repo, a module represents a
branch with the pattern `module-{module}`, a chapter represents a branch with the
pattern `{module}-chapter-{chapter}`, and a step represents a commit on a chapter branch.
There are particular commit messages that mark the starting and stopping commits of a
chapter.

## Taking a Course

You can take a course by cloning a repository created or meant to be read with Learn It.
Once you've cloned the repo, simply navigate to its top-level directory and run `learnit start`.

You may be encouraged to open a second terminal to view output from processes the instructor
set up to run when taking the course. These processes can be things like tests, local servers,
docker containers, or any other bash-based command hosted in the repo.

## Creating a Course

You can create a course by starting from scratch or from an existing repo. To start from
scratch, create a directory and run:

```
learnit init
```

If there is no `.git` present, `learnit` will initialize the repo. Since all course information
is stored in `git`, you can do any level of editing or manipulation you need to. However, the
CLI provides all the tools you should need to create a course.

### Adding a Module

You can add a module to a course with the command:

```
learnit new module <module_branch_or_name> [--name=<module_name>] [--cwd=<directory>]
```

You can provide the module name as a branch (`module-module-name`) or the name (`Module Name`),
or both (When providing both, provide the name as a named argument). If you do not provide one
or the other, it will be inferred.

You can also provide a working directory for the module, which will force only changes in that
folder to be committed and will be the assumed directory to run any commands in.

### Adding a Chapter

You can add a chapter to a course with the command:

```
learnit new chapter [chapter_title] [--module=<module_branch_or_name>] [--merge=[true]] [--base=<module>]
```

Chapters are automatically incremented up from the last, starting at `01`. You must be currently
navigated to a module or provide a module explicitly. You can optionally provide a chapter
title that will be presented to the user when taking the course.

The default behavior is to merge the chapter back into the module's branch after completion, so that
the next chapter created can build off the previous work. If you do not want this particular chapter
to be merged back in, you can set the `merge` flag to false. You can also merge when finishing or manually
perform a merge at any time.

The default behavior also includes creating the chapter branch off the top of the module branch, but
you can also specify a different starting point, such as an unmerged chapter or previous chapter point.

When working inside a chapter, you can commit to git as many times as you wish as setup. Once you are
ready to start showing the user code changes, you want to create your first `step`.

### Adding a Step

You can add a step to a course with the command:

```
learnit new step [label] [--module=<module_branch_or_name>] [--chapter=<chapter_branch_or_name>]
```

Steps can optionally be labeled for better tracking and editing. If you are not already on a
chapter branch, you must provide a chapter. You can also optionally target a module and chapter
in order to create a new step and jump to it.

### Editing a Step

You can edit a step by referencing it either through its label or its index:

```
learnit edit step [label_or_index] [--module=<module_branch_or_name>] [--chapter=<chapter_branch_or_name>]
```

Editing a step resets the repo to its commit and does a soft reset so that you can see the changes
you've already made. Unless you are editing the most current step, the steps following will be undone.

If you do not provide a label or index, The most recent step will be soft reset to allow for editing.

If you already have more changes in staging, they will be added on top and automatically commited.

If you do not have changes in staging, you can make your changes and the run:

```
learnit finish step
```

In order to commit the step to the chapter.

### Finish a Chapter

Once you've completed the work on a chapter, you can finish a chapter with:

```
learnit finish chapter [--merge=[value_set_when_created]]
```

This will take the last step of the chapter and alter it to mark it as the last. It will also
merge the chapter branch back into the module based off the `merge` flag, which is set at the
time of creation, but can be overwritten.

### Create a Chapter Summary

You can create a summary of a chapter by running:

```
learnit summarize chapter [--only-show-on-complete=[true]]
```

A summary of a chapter allows you to describe the full contents while also allowing the user
to view the full code delta described by all the steps. You can optionally set a flag to only
allow the user to access the summary when the have completed the chapter or to be able to
access the summary at any point.

### Create a Module Summary

In some cases, it may make sense to show the combined affects of multiple chapters in a
module, but not have the individual chapters affect one another. A summary can be created
by running:

```
learnit summarize module [--chapters=<c1>,<c2>] [--only-show-on-complete=true]
```

This will create a new branch of the pattern `{module}-summary` that merges all chapter
branches into a single in the order they appear. Optionally, you can pass in a set of
chapters that will be used to create the summary and will be merged in the order dictated.

If a merge conflict occurs, you must resolve it yourself.

You can also optionally set a flag not allowing the user to view the summary until all chapters
are completed.

### Create a Course Summary

A course summary typically is just the collection of all module summaries. This type of summary
usually would show the user the final state of all modules by merging all branches of the pattern
`{module}-summary` and then allowing you to write a short synopsis. You can do this by running:

```
learnit summarize course [--modules=<m1>,<m2>] [--only-show-on-complete=[true]]
```

You can optionally set which modules are included in the summary as well as control when the user
is allowed to access the summary. It is important to note though that these restrictions are only
through the `learnit` interface since the content is stored in `git`, a user can navigate to any
branch they please.

### The Script

The best way to communicate with the user is through the script. The script gets saved off on a
per-module basis as a markdown file. The basic structure of this markdown file is that the module
name is the title (`# Module Title`), each chapter is a section (`## Chapter Title`), and each
step is an `h3` (`### Step Label`). All text between these markers is printed before giving the
user navigation choices.

Because the script is commited as a file (by default, of the pattern `./{module}.md`), it can be
edited at any time, evolving at the same time as the code, or being pre-written or slightly tweaked
over time.

### Other Course Settings

Often there is a need to customize the experience a user will have while taking the course. This
could be in the form of running a test suite, launching a server, or simply running the code and
showing the output in a terminal.

You can set up scripts to run at the course, module, chapter, or even step level. You can also
set up a script or command to be killed a rerun for each step so as to not have to set up the
command for each individual step.

The management of these processes is dedicated to a separate `learnit output` call and all output
is piped to `stdout` with the option to prefix output.

You can also either force or allow the user to turn on outputting the `git diff` of each step to
this same stream so that a user need only have 2 terminals running to experience the full course.
This output can also be piped to a separate terminal with the command `learnit output --delta`
which can be run by the user at any time and combined with `learnit output --no-delta` to avoid
duplicated output.

Adding a command to run is very easy:

```
learnit new command <command> <--at-current> [--module=<module>] [--chapter=<chapter>] [--step=<step>] [--reload-on-step=[false]] [--cwd=[directory]]
```

Depending on where you are currently navigated to and where you want to run the command, you will
need to specify a module, chapter, or step. If you are currently recording steps, you must specify
`--chapter` to avoid associating the command with the step (if you do not specify the module or
chapter directly, the current location is assumed).

You can pass in the flag `--reload-on-step` to ensure the command will be stopped if it is currently
running and the started again. Additionally, the user may at any time restart all commands by
simpley killing the `learnit output` session and restarting it.

The delta output can be controlled further by using a `.learnitignore` to dictate which files should not be
shown in the delta. By default, any `.SCRIPT.md`, `.learnitignore` and progress files are ignored.
**Currently this ignore file is only supported at the course's root directory.**

## TODO: What is to Come

For creators:

 - `learnit init` - completed, might need to have it initialize some more things though.
 - `learnit new module` - completed.
 - `learnit new chapter` - completed.
 - `learnit new step` - completed.
 - `learnit new command` - completed.
 - `learnit update step` - completed.
 - `learnit revert step` - completed.
 - `learnit delete module` - not started.
 - `learnit delete chapter` - not started.
 - `learnit finish chapter` - completed.
 - `learnit summarize course` - completed, reader needs update.
 - `learnit summarize module` - completed, reader needs update.
 - `learnit summarize chapter` - completed, reader needs update.
 - `.learnitignore` - not started, eventually want multiple directory support, support module or chapter annotations
 - `.SCRIPT.md` - not started, prompt when creating module, chapter, and step, associate with module
 - mark course/module/chapter as complete - started, have mechanism for keeping track of progress
 - `learnit save` - not started, create a commit that is not a step, etc.
 - `learnit upload` - not started, equivalent to `git push --force-with-lease`
 - `learnit rebase` - not started, rebase all branches intelligently (for changes to master that need to be everywhere)
 - add cwd to creation of modules to allow scoping of commits, running of commands
 - `learnit squash-scripts` - not started, collapses all changes to scripts to single commit so it does not change dynamically.

For consumers:

 - `learnit start`- started, navigates course, needs to print script
 - `learnit output` - mostly done, watches location and starts/stops commands as necessary, reporting their output
 - `learnit reset` - not started, erases all progress, resets to `master`
 - `learnit bookmark` - not started, allows user to set up a quick return point
 - `learnit annotate` - not started, allows user to save changes they made
 - `learnit settings` - not started, allows user to configure setup, such as soft stepping so that deltas are visible to outside programs.

For both:

 - contextual `help` - not started, only render commands that are relevant to current situation
