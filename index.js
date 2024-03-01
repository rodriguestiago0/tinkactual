#!/usr/bin/env node
const meow = require("meow");
const thinkactual = require("./cli.js");
const cli = meow(
    `
  Usage
    $ thinkactual <command> <flags>

  Commands & Options
    ls               List currently syncing accounts
    import           Sync bank accounts to Actual Budget
      --since, -s    The start date after which transactions should be imported. Defaults to beginning of current month, format: yyyy-MM-dd, ex: --since=2020-05-28
    config           Print the location of thinkactual the config file
    check            Compare the Actual Budger balance to the synced accounts
    --version        Print the version of thinkactual being used


  Options for all commands
    --user, -u       Specify the user to load configs for 

  Examples
    $ thinkactual import --account="My Checking" --since="2020-05-28"
`,
    {
        flags: {
            user: {
                alias: "u",
                type: "string",
            },
            account: {
                alias: "a",
                type: "string",
            },
            since: {
                alias: "s",
                type: "string",
            },
        },
    }
);

thinkactual(cli.input[0], cli.flags);
