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
Once you've cloned the repo, simply navigate to its top-level directory and run `learnit`.

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
learnit create module <module_name> [module_title]
```

You can provide the module name as a branch (`module-module-name`) or the name (`Module Name`),
or both. If you do not provide one or the other, it will be inferred.

### Adding a Chapter

You can add a chapter to a course with the command:

```
learnit create chapter [chapter_title] [--module=<module_branch_or_name>]
```

Chapters are automatically incremented up from the last, starting at `01`. You must be currently
navigated to a module or provide a module explicitly. You can optionally provide a chapter
title that will be presented to the user when taking the course.

### Adding a Step

You can add a step to a course with the command:

```
learnit create step [label] [--module=<module_branch_or_name>] [--chapter=<chapter_branch_or_name>]
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
learnit finish chapter
```

This will take the last step of the chapter and alter it to mark it as the last.

### Create a Module Summary

In some cases, it may make sense to show the combined affects of multiple chapters in a
module, but not have the individual chapters affect one another. A summary can be created
by running:

```
learnit summarize module [--chapters=<c1>,<c2>]
```

This will create a new branch of the pattern `{module}-summary` that merges all chapter
branches into a single in the order they appear. Optionally, you can pass in a set of
chapters that will be used to create the summary and will be merged in the order dictated.

If a merge conflict occurs, you must resolve it yourself.
