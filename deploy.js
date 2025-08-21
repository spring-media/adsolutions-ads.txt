const fs = require("fs"),
    EdgeGrid = require('akamai-edgegrid'),
    SecretsManagerClient = require("@aws-sdk/client-secrets-manager").SecretsManagerClient,
    GetSecretValueCommand = require("@aws-sdk/client-secrets-manager").GetSecretValueCommand,
    Netstorage = require("netstorageapi");

const deployHook = {
    accounts: {},
    akamaiUrls: [],
    files: [],
    getSecret: async (name) => {
        const client = new SecretsManagerClient({
            region: "eu-central-1",
        });
        return client.send(new GetSecretValueCommand({
                SecretId: name
            })
        );
    },
    init: async () => {
        const keys = ["asadcdn_api", "edgegrid"];
        for (const key of keys) {
            deployHook.accounts[key] = JSON.parse((await deployHook.getSecret(key)).SecretString);
        }
        deployHook.uploadToCDN();
    },
    invalidateAkamaiCache: () => {
        if (deployHook.akamaiUrls.length) {
            const c = deployHook.accounts['edgegrid'];
            const eg = new EdgeGrid(c['client_token'], c['client_secret'], c['access_token'], c['baseUri']);
            eg.auth({
                path: "/ccu/v3/delete/url/production",
                method: 'POST',
                headers: {
                    accept: 'application/json',
                    'content-type': 'application/json; charset=utf-8;'
                },
                body: {
                    objects: deployHook.akamaiUrls
                }
            }).send(() => {
            });
            eg.auth({
                path: "/ccu/v3/delete/url/staging",
                method: 'POST',
                headers: {
                    accept: 'application/json',
                    'content-type': 'application/json; charset=utf-8;'
                },
                body: {
                    objects: deployHook.akamaiUrls
                }
            }).send(() => {
            });
        }
    },
    process: () => {
        if (!deployHook.files.length) {
            deployHook.invalidateAkamaiCache();
        } else {
            let file = deployHook.files.shift();
            const ns = new Netstorage(deployHook.accounts["asadcdn_api"]),
                pathArray = file.split("/"),
                filename = pathArray.pop(),
                dir = pathArray.shift() && pathArray.join("/"),
                dest = `/${deployHook.accounts["asadcdn_api"]["cpCode"]}/pec/${dir}/${filename}`;

            console.log("----------------------------------");
            console.log(file, dest);

            ns.upload(file, dest, (error, response, body) => {
                if (error) { // errors other than http response codes
                    console.log(`Got error: ${error.message}`)
                } else {
                    console.log(body);
                }
                deployHook.process();
            });
        }
    },
    uploadToCDN: () => {
        deployHook.akamaiUrls = [];
        deployHook.files = [];

        const distFiles = fs.readdirSync("_dist", {
            encoding: 'utf8',
            withFileTypes: true
        });
        distFiles.forEach(item => {
            if (item.isDirectory()) {
                const files = fs.readdirSync("_dist/" + item.name, {
                    encoding: 'utf8',
                    withFileTypes: true
                });
                files.forEach(file => {
                    if (!/^\.|^_/.test(file.name)) {
                        const url = file.parentPath + "/" + file.name;
                        deployHook.files.push(url);
                    }
                })
            } else if (!/^\.|^_/.test(item.name)) {
                const url = item.parentPath + "/" + item.name;
                deployHook.files.push(url);
            }
        });

        deployHook.process();
    }
};

deployHook.init().catch();
