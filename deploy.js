const fs = require("fs"),
    EdgeGrid = require('akamai-edgegrid'),
    { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager"),
    Netstorage = require("netstorageapi");

const deployHook = {
    accounts: {},
    akamaiUrls: [],
    files: [],
    getSecret: async (name) => {
        const client = new SecretsManagerClient({
            region: "eu-central-1",
        });
        const command = new GetSecretValueCommand({
            SecretId: name
        });
        return client.send(command);
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
            console.log(`Invalidating cache for ${deployHook.akamaiUrls.length} URLs:`);
            console.log(deployHook.akamaiUrls);
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
            });

            eg.send((error, response, body) => {
                if (error) {
                    console.error(`Error during cache invalidation (Production): ${error.message}`);
                } else {
                    console.log(`Cache invalidation (Production) successful: ${JSON.stringify(body)}`);
                }
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
            });

            eg.send((error, response, body) => {
                if (error) {
                    console.error(`Error during cache invalidation (Staging): ${error.message}`);
                } else {
                    console.log(`Cache invalidation (Staging) successful: ${JSON.stringify(body)}`);
                }
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
                    
                    // Convert CDN path to public URL and add it to the akamaiUrls array
                    // Use the destination path in the CDN to generate the URL
                    // The dest variable contains the path in format: /{cpCode}/pec/{dir}/{filename}
                    
                    // Use the correct CDN domain for public URLs
                    const cdnDomain = "www.asadcdn.com";
                    
                    // Generate URL based on the CDN path structure
                    // For example: https://www.asadcdn.com/pec/welt.de/ads.txt
                    const publicUrl = `https://${cdnDomain}/pec/${dir}/${filename}`;
                    
                    console.log(`Adding URL for cache invalidation: ${publicUrl}`);
                    deployHook.akamaiUrls.push(publicUrl);
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
