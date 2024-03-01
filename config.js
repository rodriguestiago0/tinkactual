const Conf = require("conf");
const config = require("dotenv").config;
config();

const ACTUAL_SERVER_URL = process.env.ACTUAL_SERVER_URL || "";
const ACTUAL_SERVER_PASSWORD = process.env.ACTUAL_SERVER_PASSWORD || "";

const APP_PORT = process.env.APP_PORT || 3000;

const APP_URL = process.env.APP_URL || "http://localhost"

const TINK_CLIENT_ID = process.env.TINK_CLIENT_ID || "";
const TINK_CLIENT_SECRET = process.env.TINK_CLIENT_SECRET || "";
const TINK_USER_ID = process.env.TINK_USER_ID || "";
const TINK_ACTOR_ID = process.env.TINK_ACTOR_ID || "";
const TINK_ACCOUNT_MAP = process.env.TINK_ACCOUNT_MAP || "";
const ACTUAL_ACCOUNT_MAP = process.env.ACTUAL_ACCOUNT_MAP || "";


function getAppConfigFromEnv() {
    var TINK_ACCOUNT_MAPPING = {}
    var ACTUAL_ACCOUNT_MAPPING = {}
    var tinkSplit = TINK_ACCOUNT_MAP.split(',');
    var actualSplit = ACTUAL_ACCOUNT_MAP.split(',');
    if (tinkSplit.length != actualSplit.length) {
        throw new Error(`Invalid accounts configs`);
    }
    for (var i = 0; i < tinkSplit.length; i++) {
        TINK_ACCOUNT_MAPPING[tinkSplit[i]] = actualSplit[i];
        ACTUAL_ACCOUNT_MAPPING[actualSplit[i]] = tinkSplit[i];
    }
    const appConfig = {
        APP_PORT,
        APP_URL,
        TINK_CLIENT_ID,
        TINK_CLIENT_SECRET,
        TINK_USER_ID,
        TINK_ACTOR_ID,
        TINK_ACCOUNT_MAPPING,
        ACTUAL_ACCOUNT_MAPPING,
        TINK_ACCOUNT_MAP,
        ACTUAL_ACCOUNT_MAP,
        ACTUAL_SERVER_URL,
        ACTUAL_SERVER_PASSWORD
    }

    // Assert that all required environment variables are set
    Object.entries(appConfig).forEach(([key, value]) => {
        if (!value) {
            throw new Error(`Missing environment variable: ${key}`);
        }
    })

    return appConfig
}


function getConf(username) {
    const appConfig = getAppConfigFromEnv();
    const key = `${username}`;

    const tmp = new Conf({
        configName: key
    });
    tmp.set("user", key);
    tmp.set("tink_accounts_map", appConfig.TINK_ACCOUNT_MAPPING)
    tmp.set("actual_accounts_map", appConfig.ACTUAL_ACCOUNT_MAPPING)
    return tmp;
}

module.exports = {
    getAppConfigFromEnv,
    getConf
}
