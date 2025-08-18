const fs = require("fs"),
    ftp = require("ftp"),
    cwd = process.cwd(),
    EdgeGrid = require('akamai-edgegrid'),
    SecretsManagerClient = require("@aws-sdk/client-secrets-manager").SecretsManagerClient,
    GetSecretValueCommand = require("@aws-sdk/client-secrets-manager").GetSecretValueCommand;

const repoHook = {
    accounts: {},
    akamaiUrls: [],
    allFiles: [],
    marketerArray: [],
    buildDist: () => {
        const now = new Date();
        repoHook.akamaiUrls = [];
        for (const marketer of repoHook.marketerArray) {
            const files = [], publishers = [],
                folder = cwd + "/" + marketer + "/",
                marketerContents = fs.readdirSync(folder, {
                    encoding: 'utf8',
                    withFileTypes: true
                });

            marketerContents.forEach(item => {
                if (!item.isDirectory()) {
                    if (!/^\.|^_|Paul\.txt$/.test(item.name)) {
                        files.push(item.name.trim());
                    }
                } else if (item.name !== "." && item.name !== "..") {
                    publishers.push(item.name.trim());
                }
            });

            for (const file of files) {
                const pathToFile = folder + file;
                const marketerContent = fs.readFileSync(pathToFile, 'utf8');

                publishers.forEach(publisher => {
                    let publisherContent = "";
                    if (fs.existsSync(folder + "/" + publisher + "/" + file)) {
                        publisherContent = fs.readFileSync(folder + "/" + publisher + "/" + file);
                    }
                    if (!fs.existsSync(cwd + "/_dist/" + publisher)) {
                        fs.mkdirSync(cwd + "/_dist/" + publisher);
                    }

                    fs.writeFileSync(cwd + "/_dist/" + publisher + "/" + file, marketerContent +
                        "\n\n" + publisherContent +
                        "\n\n" + "#File generated on " + now.toGMTString() + "\n");

                    repoHook.allFiles.push(cwd + "/_dist/" + publisher + "/" + file);
                    repoHook.akamaiUrls.push(`https://www.asadcdn.com/pec/${publisher}/${file}`);
                });
            }
        }
    },
    clearRuntime: () => {
        repoHook.akamaiUrls = [];
        repoHook.allFiles = [];
        repoHook.marketerArray = [];
    },
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
        const keys = ["asadcdn", "edgegrid"];
        for (const key of keys) {
            repoHook.accounts[key] = JSON.parse((await repoHook.getSecret(key)).SecretString);
        }
        repoHook.clearRuntime();
        repoHook.scanForMarketers();
        repoHook.buildDist();
        repoHook.uploadToCDN();
        repoHook.invalidateAkamaiCache();
        repoHook.clearRuntime();
    },
    invalidateAkamaiCache: () => {
        if (repoHook.akamaiUrls.length) {
            const c = repoHook.accounts['edgegrid'];
            const eg = new EdgeGrid(c['client_token'], c['client_secret'], c['access_token'], c['baseUri']);
            eg.auth({
                path: "/ccu/v3/delete/url/production",
                method: 'POST',
                headers: {
                    accept: 'application/json',
                    'content-type': 'application/json; charset=utf-8;'
                },
                body: {
                    objects: repoHook.akamaiUrls
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
                    objects: repoHook.akamaiUrls
                }
            }).send(() => {
            });
        }
    },
    scanForMarketers: () => {
        const rootEntry = fs.readdirSync(cwd, {
            encoding: 'utf8',
            withFileTypes: true
        });
        repoHook.marketerArray = [];
        rootEntry.forEach(item => {
            if (item.isDirectory() && !/^\.|^_|^(src|node_modules)$/.test(item.name)) {
                repoHook.marketerArray.push(item.name);
            }
        });
    },
    uploadToCDN: () => {
        const client = new ftp();
        client.on('ready', () => {
            repoHook.allFiles.forEach(file => {
                client.mkdir(file.path, true, () => {
                    client.put(cwd + "_dist", "/pec");
                });
            });
        });
        client.connect(repoHook.accounts['asadcdn']);
    }
};

repoHook.init().catch();
