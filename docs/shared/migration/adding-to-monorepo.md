# Adding Nx to NPM/Yarn/PNPM Workspace

{% callout type="note" title="Migrating from Lerna?" %}
Interested in migrating from [Lerna](https://github.com/lerna/lerna) in particular? In case you missed it, Lerna v6 is
powering Nx underneath. As a result, Lerna gets all the modern features such as caching and task pipelines. Read more
on [https://lerna.js.org/upgrade](https://lerna.js.org/upgrade).
{% /callout %}

Nx has first-class support for [monorepos](/getting-started/tutorials/npm-workspaces-tutorial). As a result, if you have
an existing NPM/Yarn or PNPM-based monorepo setup, you can easily add Nx to get

- fast [task scheduling](/features/run-tasks)
- support for [task pipelines](/concepts/task-pipeline-configuration)
- [caching](/features/cache-task-results)
- [remote caching with Nx Cloud](/ci/features/remote-cache)
- [distributed task execution with Nx Cloud](/ci/features/distribute-task-execution)

This is a low-impact operation because all that needs to be done is to install the `nx` package at the root level and
add an `nx.json` for configuring caching and task pipelines.

{% youtube
src="https://www.youtube.com/embed/ngdoUQBvAjo"
title="Add Nx to a PNPM workspaces monorepo"
width="100%" /%}

## Installing Nx

Run the following command to automatically set up Nx:

```shell
npx nx@latest init
```

Running this command will ask you a few questions about your workspace and then set up Nx for you accordingly. The setup
process detects tools which are used in your workspace and suggests installing Nx plugins to integrate the tools you use
with Nx. Running those tools through Nx will have caching enabled when possible, providing you with a faster alternative
for running those tools. You can start with a few to see how it works and then add more with
the [`nx add`](/nx-api/nx/documents/add) command later. You can also decide to add them all and get the full experience
right
away because adding plugins will not break your existing workflow.

The first thing you may notice is that Nx updates your `package.json` scripts during the setup process. Nx Plugins setup
Nx commands which run the underlying tool with caching enabled. When a `package.json` script runs a command which can be
run through Nx, Nx will replace that script in the `package.json` scripts with an Nx command that has
caching automatically enabled. Anywhere those `package.json` scripts are used, including your CI, will become faster
when possible. Let's go through an example where the `@nx/next/plugin` and `@nx/eslint/plugin` plugins are added to a
workspace with the
following `package.json`.

```diff {% fileName="package.json" %}
{
  "name": "my-workspace",
  ...
  "scripts": {
-     "build": "next build && echo 'Build complete'",
+     "build": "nx next:build && echo 'Build complete'",
-     "lint": "eslint ./src",
+     "lint": "nx eslint:lint",
    "test": "node ./run-tests.js"
  },
  ...
}
```

The `@nx/next/plugin` plugin adds a `next:build` target which runs `next build` and sets up caching correctly. In other
words, running `nx next:build` is the same as running `next build` with the added benefit of it being cacheable. Hence,
Nx replaces `next build` in the `package.json` `build` script to add caching to anywhere running `npm run build`.
Similarly, `@nx/eslint/plugin` sets up the `nx eslint:lint` command to run `eslint ./src` with caching enabled.
The `test` script was not recognized by any Nx plugin, so it was left as is. After Nx has been setup,
running `npm run build` or `npm run lint` multiple times, will be instant when possible.

You can also run any npm scripts directly through Nx with `nx build` or `nx lint` which will run the `npm run build`
and `npm run lint` scripts respectively. In the later portion of the setup flow, Nx will ask if you would like some of
those npm scripts to be cacheable. By making those cacheable, running `nx build` rather than `npm run build` will add
another layer of cacheability. However, `nx build` must be run instead of `npm run build` to take advantage of the
cache.

## Inferred Tasks

You may have noticed that `@nx/next` provides `dev` and `start` tasks in addition to the `next:build` task. Those tasks
were created by the `@nx/next/plugin` plugin from your existing Next.js configuration. You can see the configuration for
the Nx Plugins in `nx.json`:

```json {% fileName="nx.json" %}
{
  "plugins": [
    {
      "plugin": "@nx/eslint/plugin",
      "options": {
        "targetName": "eslint:lint"
      }
    },
    {
      "plugin": "@nx/next/plugin",
      "options": {
        "buildTargetName": "next:build",
        "devTargetName": "dev",
        "startTargetName": "start"
      }
    }
  ]
}
```

Each plugin can accept options to customize the projects which they create. You can see more information about
configuring the plugins on the [`@nx/next/plugin`](/nx-api/next) and [`@nx/eslint/plugin`](/nx-api/eslint) plugin pages.

To view all available tasks, open the Project Details view with Nx Console or use the terminal to launch the project
details in a browser window.

```shell
nx show project my-workspace --web
```

{% project-details title="Project Details View" height="100px" %}

```json
{
  "project": {
    "name": "my-workspace",
    "data": {
      "root": ".",
      "targets": {
        "eslint:lint": {
          "cache": true,
          "options": {
            "cwd": ".",
            "command": "eslint ./src"
          },
          "inputs": [
            "default",
            "{workspaceRoot}/.eslintrc",
            "{workspaceRoot}/tools/eslint-rules/**/*",
            {
              "externalDependencies": ["eslint"]
            }
          ],
          "executor": "nx:run-commands",
          "configurations": {}
        },
        "next:build": {
          "options": {
            "cwd": ".",
            "command": "next build"
          },
          "dependsOn": ["^build"],
          "cache": true,
          "inputs": [
            "default",
            "^default",
            {
              "externalDependencies": ["next"]
            }
          ],
          "outputs": ["{projectRoot}/.next", "{projectRoot}/.next/!(cache)"],
          "executor": "nx:run-commands",
          "configurations": {}
        },
        "dev": {
          "options": {
            "cwd": ".",
            "command": "next dev"
          },
          "executor": "nx:run-commands",
          "configurations": {}
        },
        "start": {
          "options": {
            "cwd": ".",
            "command": "next start"
          },
          "dependsOn": ["build"],
          "executor": "nx:run-commands",
          "configurations": {}
        }
      },
      "sourceRoot": ".",
      "name": "my-workspace",
      "projectType": "library",
      "implicitDependencies": [],
      "tags": []
    }
  },
  "sourceMap": {
    "root": ["package.json", "nx/core/package-json-workspaces"],
    "targets": ["package.json", "nx/core/package-json-workspaces"],
    "targets.eslint:lint": [".eslintrc.json", "@nx/eslint/plugin"],
    "targets.eslint:lint.command": [".eslintrc.json", "@nx/eslint/plugin"],
    "targets.eslint:lint.cache": [".eslintrc.json", "@nx/eslint/plugin"],
    "targets.eslint:lint.options": [".eslintrc.json", "@nx/eslint/plugin"],
    "targets.eslint:lint.inputs": [".eslintrc.json", "@nx/eslint/plugin"],
    "targets.eslint:lint.options.cwd": [".eslintrc.json", "@nx/eslint/plugin"],
    "targets.next:build": ["next.config.js", "@nx/next/plugin"],
    "targets.next:build.command": ["next.config.js", "@nx/next/plugin"],
    "targets.next:build.options": ["next.config.js", "@nx/next/plugin"],
    "targets.next:build.dependsOn": ["next.config.js", "@nx/next/plugin"],
    "targets.next:build.cache": ["next.config.js", "@nx/next/plugin"],
    "targets.next:build.inputs": ["next.config.js", "@nx/next/plugin"],
    "targets.next:build.outputs": ["next.config.js", "@nx/next/plugin"],
    "targets.next:build.options.cwd": ["next.config.js", "@nx/next/plugin"],
    "targets.dev": ["next.config.js", "@nx/next/plugin"],
    "targets.dev.command": ["next.config.js", "@nx/next/plugin"],
    "targets.dev.options": ["next.config.js", "@nx/next/plugin"],
    "targets.dev.options.cwd": ["next.config.js", "@nx/next/plugin"],
    "targets.start": ["next.config.js", "@nx/next/plugin"],
    "targets.start.command": ["next.config.js", "@nx/next/plugin"],
    "targets.start.options": ["next.config.js", "@nx/next/plugin"],
    "targets.start.dependsOn": ["next.config.js", "@nx/next/plugin"],
    "targets.start.options.cwd": ["next.config.js", "@nx/next/plugin"],
    "sourceRoot": ["package.json", "nx/core/package-json-workspaces"],
    "name": ["package.json", "nx/core/package-json-workspaces"],
    "projectType": ["package.json", "nx/core/package-json-workspaces"],
    "targets.nx-release-publish": [
      "package.json",
      "nx/core/package-json-workspaces"
    ],
    "targets.nx-release-publish.dependsOn": [
      "package.json",
      "nx/core/package-json-workspaces"
    ],
    "targets.nx-release-publish.executor": [
      "package.json",
      "nx/core/package-json-workspaces"
    ],
    "targets.nx-release-publish.options": [
      "package.json",
      "nx/core/package-json-workspaces"
    ]
  }
}
```

{% /project-details %}

The project detail view lists all available tasks, the configuration values for those tasks and where those
configuration values are being set.

## Configure an Existing Script to Run with Nx

If you want to run one of your existing scripts with Nx, you need to tell Nx about it.

1. Preface the script with `nx exec -- ` to have `npm run test` invoke the command with Nx.
2. Define caching settings.

The `nx exec` command allows you to keep using `npm test` or `npm run test` (or other package manager's alternatives) as
you're accustomed to. But still get the benefits of making those operations cacheable. Configuring the `test` script
from the example above to run with Nx would look something like this:

```json {% fileName="package.json" %}
{
  "name": "my-workspace",
  ...
  "scripts": {
    "build": "nx next:build",
    "lint": "nx eslint:lint",
    "test": "nx exec -- node ./run-tests.js"
  },
  ...
  "nx": {
    "targets": {
      "test": {
        "cache": "true",
        "inputs": [
          "default",
          "^default"
        ],
        "outputs": []
      }
    }
  }
}
```

Now if you run `npm run test` or `nx test` twice, the results will be retrieved from the cache. The `inputs` used in
this example are as cautious as possible, so you can significantly improve the value of the cache
by [customizing Nx Inputs](/recipes/running-tasks/configure-inputs) for each task.

## Incrementally Adopting Nx

All the features of Nx can be enabled independently of each other. Hence, Nx can easily be adopted incrementally by
initially using Nx just for a subset of your scripts and then gradually adding more.

For example, use Nx to run your builds:

```shell
npx nx run-many -t build
```

But instead keep using NPM/Yarn/PNPM workspace commands for your tests and other scripts. Here's an example of using
PNPM commands to run tests across packages

```shell
pnpm run -r test
```

This allows for incrementally adopting Nx in your existing workspace.

## Learn More

{% cards %}

{% card title="Cache Task Results" description="Learn more about how caching works" type="documentation" url="
/features/cache-task-results" /%}

{% card title="Task Pipeline Configuration" description="Learn more about how to setup task dependencies" type="
documentation" url="/concepts/task-pipeline-configuration" /%}

{% card title="Nx Ignore" description="Learn about how to ignore certain projects using .nxignore" type="documentation"
url="/reference/nxignore" /%}

{% card title="Nx and Turbo" description="Read about how Nx compares to Turborepo" url="
/concepts/more-concepts/turbo-and-nx" /%}

{% card title="Integrated Repos vs Package-Based Repos" description="Learn about two styles of monorepos." url="
/concepts/integrated-vs-package-based" /%}

{% /cards %}
