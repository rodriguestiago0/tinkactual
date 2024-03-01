const util = require("util");
const path = require("path");
const opn = require("better-opn");
const dateFns = require("date-fns");
const inquirer = require("inquirer");
const terminalLink = require("terminal-link");
const { getAppConfigFromEnv, getConf } = require("./config.js");
const { initialize, getLastTransactionDate, importTransactions, listAccounts, finalize, getBalance } = require("./actual.js");
const { getTransactions, getTinkBalance } = require("./tink.js");


let config;
const appConfig = getAppConfigFromEnv()

const printSyncedAccounts = () => {
    console.log(config)
    const actualData = config.get("actualSync");
    const tinkData = config.get("accounts");
    if (!actualData) {
        console.log("No syncing data found");
        return;
    }

    console.log("The following accounts are linked to Actual:");
    console.table(
        Object.values(actualData).map((account) => ({
            "Actual Account": account.actualName,
            "Actual Account Id": account.actualAccountId,
            "Tink Account Id": account.tinkAccountId,
        }))
    );
};

/**
 * 
 * @param {string} command 
 * @param {object} flags 
 * @param {string} flags.since
 */
module.exports = async (command, flags) => {
    if (!command) {
        console.log('Try "thinkactual --help"');
        process.exit();
    }

    config = getConf(flags.user || "default")

    if (command === "config") {
        console.log(`Config for this app is located at: ${config.path}`);
    } else if (command == "init") {
        const accountsInTheActualBudget = await listAccounts(await initialize(config));
        actualMapping = config.get('actual_accounts_map')
        accountsInTheActualBudget.forEach(actualAccount => {
            tinkAccount = actualMapping[actualAccount.id]
            if (tinkAccount != undefined) {
                config.set(`actualSync.${actualAccount.id}`, {
                    actualName: actualAccount.name,
                    actualAccountId: actualAccount.id,
                    tinkAccountId: tinkAccount,
                });
            }
        });
    } else if (command === "import") {
        const syncingData = config.get(`actualSync`) || {};
        const actual = await initialize(config);
        tinkMapping = config.get('tink_accounts_map')

        startDate = new Date()
        for (let [actualId, account] of Object.entries(syncingData)) {
            accountStartDate = new Date(
                flags["since"] ||
                account.lastImport ||
                await getLastTransactionDate(actual, actualId)
            );
            if (accountStartDate < startDate) {
                startDate = accountStartDate
            }
        };
        console.log("Importing transactions for account from ", startDate)
        mappedtransactions = await getTransactions(startDate)
        for (let [tinkID, transactions] of Object.entries(mappedtransactions)) {
            var actualId = tinkMapping[tinkID]
            if (actualId == undefined)
            {
                throw new Error("Something went wrong");
            }
            /*const { confirm } = await inquirer.prompt({
                type: "confirm",
                name: "confirm",
                message: `Are you sure you want to import ` + transactions.length + ` to ` + syncingData[actualId].actualName +`. Proceed?`,
            });
        
            if (!confirm) {
                continue;
            }*/
            await importTransactions(actual, actualId, transactions);
        };

        await finalize(actual);

    } else if (command == "check") {
        const actual = await initialize(config);
        const syncingData = config.get(`actualSync`) || {};

        const balancesFromTink = await getTinkBalance();
        for (let [actualId, account] of Object.entries(syncingData)) {
            const balanceFromActual = await getBalance(actual, actualId);

            balanceFromTink = balancesFromTink[account.tinkAccountId]
            const actualConverted = actual.utils.integerToAmount(balanceFromActual);
            
            console.log(`--------------------`)
            console.log(`Checking balance for account: ${account.actualName}`)
            console.log("Actual balance: ", actualConverted)
            console.log("Tink balance: ", balanceFromTink)
            console.log(`--------------------`)
        }

    } else if (command === "ls") {
        printSyncedAccounts();
    }
    process.exit();
};
