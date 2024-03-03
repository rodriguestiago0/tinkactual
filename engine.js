const { getAppConfigFromEnv, getConf } = require("./config");
const { getTransactions, getTinkBalance } = require("./tink.js");
const { initialize, getLastTransactionDate, importTransactions, finalize, getBalance, listAccounts  } = require("./actual.js");

const appConfig = getAppConfigFromEnv();
config = getConf("default")

async function importTinkTransactions() {
    const syncingData = config.get(`actualSync`) || {};
    const actual = await initialize(config);
    tinkMapping = appConfig.TINK_ACCOUNT_MAPPING

    startDate = new Date()
    for (let [actualId, account] of Object.entries(syncingData)) {
        accountStartDate = new Date(
            account.lastImport ||
            await getLastTransactionDate(actual, actualId)
        );
        if (accountStartDate < startDate) {
            startDate = accountStartDate
            startDate.setDate(startDate.getDate() -1);
        }
    };
    console.info("Importing transactions for account from ", startDate)
    var mappedtransactions = await getTransactions(startDate)
    for (let [tinkID, transactions] of Object.entries(mappedtransactions)) {
        var actualId = tinkMapping[tinkID]
        if (actualId == undefined) {
            throw new Error("Something went wrong");
        }
        await importTransactions(actual, actualId, transactions);
        config.set(`actualSync.${actualId}.lastImport`, new Date());
    };

    await finalize(actual);
}

async function compareBalance() {
    const actual = await initialize(config);
    const syncingData = config.get(`actualSync`) || {};

    const balancesFromTink = await getTinkBalance();
    for (let [actualId, account] of Object.entries(syncingData)) {
        const balanceFromActual = await getBalance(actual, actualId);

        balanceFromTink = balancesFromTink[account.tinkAccountId]
        const actualConverted = actual.utils.integerToAmount(balanceFromActual);

        console.info(`--------------------`)
        console.info(`Checking balance for account: ${account.actualName}`)
        console.info("Actual balance: ", actualConverted)
        console.info("Tink balance: ", balanceFromTink)
        console.info(`--------------------`)
    }
    await finalize(actual);
}

async function init () {
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
}


module.exports = {
    importTinkTransactions,
    compareBalance,
    init
}
