const { getAppConfigFromEnv } = require("./config");
const inquirer = require("inquirer");
const dateFns = require("date-fns");



const appConfig = getAppConfigFromEnv();

const authorization_generate_code = async () => {
    u = new URLSearchParams({
        client_id: appConfig.TINK_CLIENT_ID,
        client_secret: appConfig.TINK_CLIENT_SECRET,
        grant_type: 'client_credentials',
        scope: 'authorization:grant',
    });
    const token = await fetch('https://api.tink.com/api/v1/oauth/token', {
        method: 'POST',
        body: u,
        headers: {
            'Content-type': 'application/x-www-form-urlencoded',
        },
    })
        .then((response) => response.json())
        .then((json) => json.access_token)
        .catch((err) => {
            console.error("error occured", err)
        });
    return token
}

const generate_code = async (token) => {
    u = new URLSearchParams({
        user_id: appConfig.TINK_USER_ID,
        id_hint: 'tiago_food',
        actor_client_id: appConfig.TINK_ACTOR_ID,
        scope: 'authorization:read,authorization:grant,credentials:refresh,credentials:read,credentials:write,providers:read,user:read',
    });
    bearer = 'Bearer ' + token
    code = await fetch('https://api.tink.com/api/v1/oauth/authorization-grant/delegate', {
        method: 'POST',
        body: u,
        headers: {
            'Content-type': 'application/x-www-form-urlencoded',
            'Authorization': bearer
        },
    })
        .then((response) => response.json())
        .then((json) => json.code)
        .catch((err) => {
            console.error("error occured", err)
        });
    return code
}

const authorization = async (token) => {
    u = new URLSearchParams({
        user_id: appConfig.TINK_USER_ID,
        scope: 'accounts:read,balances:read,transactions:read,provider-consents:read',
    });
    bearer = 'Bearer ' + token
    const authorizationCode = await fetch('https://api.tink.com/api/v1/oauth/authorization-grant', {
        method: 'POST',
        body: u,
        headers: {
            'Content-type': 'application/x-www-form-urlencoded',
            'Authorization': bearer
        },
    })
        .then((response) => response.json())
        .then((json) => json.code)
        .catch((err) => {
            console.error("error occured", err)
        });
    return authorizationCode
}

const authorization_access_code = async (code) => {
    u = new URLSearchParams({
        client_id: appConfig.TINK_CLIENT_ID,
        client_secret: appConfig.TINK_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
    });
    token = await fetch('https://api.tink.com/api/v1/oauth/token', {
        method: 'POST',
        body: u,
        headers: {
            'Content-type': 'application/x-www-form-urlencoded',
        },
    })
        .then((response) => response.json())
        .then((json) => json.access_token)
        .catch((err) => {
            console.error("error occured", err)
        });
    return token
}

const getBalances = async (token) => {
    bearer = 'Bearer ' + token
    return await fetch('https://api.tink.com/data/v2/accounts', {
        method: 'GET',
        headers: {
            'Authorization': bearer
        },
    })
        .then((response) => response.json())
        .catch((err) => {
            console.error("error occured", err)
        });
}

async function authenticate() {
    token = await authorization_generate_code();
    code = await generate_code(token)
    authorizationCode = await authorization(token);
    return await authorization_access_code(authorizationCode)
}

async function getTinkBalance() {
    authorizationToken = await authenticate()
    res = await getBalances(authorizationToken)
    currentBalances = {}
    res.accounts.forEach(account => {
        amount = convertAmount(account.balances.available.amount)
        currentBalances[account.id] = amount
    });
    return currentBalances
}

function convertAmount(amount) {
    unscaledValue = amount.value.unscaledValue
    scale = amount.value.scale
    amount = unscaledValue / Math.pow(10, scale)
    return Math.trunc(amount * 100);
}

const getAllTransactions = async (token, startDate) => {
    allTransactions = []
    nextPage = ""
    do {
        url = 'https://api.tink.com/data/v2/transactions?'
        if (nextPage != "") {
            url = url + "pageToken=" + nextPage
        }
        if (startDate != "") {
            url = url + "bookedDateGte=" + dateFns.format(startDate, "yyyy-MM-dd")
        }
        bearer = 'Bearer ' + token
        res = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': bearer
            },
        })
            .then((response) => response.json())
            .catch((err) => {
                console.error("error occured", err)
            });
        nextPage = res.nextPageToken
        allTransactions = allTransactions.concat(res.transactions)
    } while (nextPage != "")
    return allTransactions;
}

async function getTransactions(startDate) {
    authorizationToken = await authenticate()
    transactions = await getAllTransactions(authorizationToken, startDate)
    parsedTransactions = {}
    transactions.forEach(transaction => {
        if (parsedTransactions[transaction.accountId] == undefined) {
            parsedTransactions[transaction.accountId] = []
        }
        parsedTransactions[transaction.accountId].push({
            date: transaction.dates.booked,
            amount: convertAmount(transaction.amount),
            payee_name: transaction.descriptions.display,
            imported_payee: transaction.descriptions.original,
            imported_id: transaction.id,
            cleared: transaction.status == 'BOOKED',
        })
    });

    return parsedTransactions
}

module.exports = {
    getTransactions,
    getTinkBalance
}
