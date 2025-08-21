const fs = require("fs"), cwd = process.cwd();

const buildHook = {
    marketerArray: [],
    buildDist: () => {
        const now = new Date();
        buildHook.akamaiUrls = [];

        if (!fs.existsSync("_dist")) {
            fs.mkdirSync("_dist");
        }

        for (const marketer of buildHook.marketerArray) {
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
                });
            }
        }
    },
    init: () => {
        buildHook.scanForMarketers();
        buildHook.buildDist();
    },
    scanForMarketers: () => {
        const rootEntry = fs.readdirSync(cwd, {
            encoding: 'utf8',
            withFileTypes: true
        });
        buildHook.marketerArray = [];
        rootEntry.forEach(item => {
            if (item.isDirectory() && !/^\.|^_|^(src|node_modules)$/.test(item.name)) {
                buildHook.marketerArray.push(item.name);
            }
        });
    }
};

buildHook.init();
