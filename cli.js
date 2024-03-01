const { getAppConfigFromEnv, getConf } = require("./config.js");
const { initialize, listAccounts } = require("./actual.js");
const { importTinkTransactions, compareBalance } = require("./engine.js");

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
        actualMapping = appConfig.ACTUAL_ACCOUNT_MAPPING
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
        await importTinkTransactions();
    } else if (command == "check") {
        await compareBalance();
    } else if (command === "ls") {
        printSyncedAccounts();
    }
    process.exit();
};
