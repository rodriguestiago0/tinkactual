const { importTinkTransactions, init } = require("./engine.js");
var cron = require('node-cron');
const parser = require('cron-parser');
const { getAppConfigFromEnv } = require("./config");

const appConfig = getAppConfigFromEnv();

init()

var cronExpression = "0 */4 * * *";
if (appConfig.CRON_EXPRESSION != "") {
    cronExpression = appConfig.CRON_EXPRESSION
}
const interval = parser.parseExpression(cronExpression);
console.info('Next run:', interval.next().toISOString());

cron.schedule(cronExpression, () => {
    importTinkTransactions();
    console.info('Next run:', interval.next().toISOString());
});

