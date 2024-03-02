const { getAppConfigFromEnv, getConf } = require("./config.js");
const { importTinkTransactions, compareBalance, init } = require("./engine.js");

let config;
const appConfig = getAppConfigFromEnv()

const printSyncedAccounts = () => {
    const actualData = config.get("actualSync");
    const tinkData = config.get("accounts");
    if (!actualData) {
        console.error("No syncing data found");
        return;
    }

    console.info("The following accounts are linked to Actual:");
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
        init()
    } else if (command === "import") {
        await importTinkTransactions();
    } else if (command == "check") {
        await compareBalance();
    } else if (command === "ls") {
        printSyncedAccounts();
    }
    process.exit();
};
