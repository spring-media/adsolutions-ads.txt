/* NODE service to check ads.txt files
* can be invoked by cronjob using
* node -e 'require("adsTxtValidator.js").startAnalysis()'
*
* one need to set
*   * URL_TO_PAGE_CONFIGS
*   * adsTxtValidator.skipList
*   * adsTxtValidator.observeArray
* */

const nodemailer = require('nodemailer');
const {execSync} = require('child_process');
const fs = require("fs");
const h2p = require('html2plaintext');
const URL_TO_PAGE_CONFIGS = "";

let adsTxtValidator = {
    htmlSignature: '',
    skipList: [], // list of domains to ignore, mainly subdomains
    observeArray: [], // URLs holding entries to scan for
    get: function (url) {
        return execSync('curl -s ' + url).toString();
    },
    scanforSubdomain: function (checklist, response, page) {
        let subdomainMatch = response.match(/subdomain=(.*)?/g);
        if (subdomainMatch) {
            subdomainMatch.forEach(function (subMatch) {
                let subdomain = subMatch.replace("subdomain=", "");
                let entries = adsTxtValidator.compare(checklist, subdomain);
                if (entries.length) {
                    adsTxtValidator.report(subdomain, entries, page["Objectmanager Mailadress"]);
                }
            });
        }
    },
    compare: function (checklist, domain, page) {
        let missing = [];
        if (!domain.match(adsTxtValidator.skipList.join("|"))) {
            let pubAdsTxt;
            try {
                pubAdsTxt = adsTxtValidator.get("https://" + domain + "/ads.txt").replace(/,\s/g, ",");
                checklist.forEach(function (entry) {
                    entry = entry.replace(/\s*#.*/, "").replace(/,\s/g, ",").trim();
                    if (entry && entry.indexOf("#") !== 0 && pubAdsTxt.indexOf(entry) === -1) {
                        missing.push(entry);
                    }
                })
            } catch (e) {
                try {
                    pubAdsTxt = adsTxtValidator.get("https://www." + domain + "/ads.txt").replace(/,\s/g, ",");
                    checklist.forEach(function (entry) {
                        entry = entry.replace(/\s*#.*/, "").replace(/,\s/g, ",").trim();
                        if (entry && entry.indexOf("#") !== 0 && pubAdsTxt.indexOf(entry) === -1) {
                            missing.push(entry);
                        }
                    })
                } catch (e) {
                    console.log(e);
                    adsTxtValidator.reportError(domain, page["Objectmanager Mailadress"]);
                }
            }
            if (pubAdsTxt && pubAdsTxt.indexOf("subdomain") > -1) {
                adsTxtValidator.scanforSubdomain(checklist, pubAdsTxt, page);
            }
        }
        return missing;
    },
    report: function (domain, entries, to) {
        let mailtext = '' + entries.join() + adsTxtValidator.htmlSignature;
        adsTxtValidator.transporter.sendMail({
            to: to,
            subject: "Wrong ads.txt",
            text: h2p(mailtext),
            html: mailtext
        });
    },
    reportError: function (domain, to) {
        let mailtext = `We couldn't detected an ads.txt on ${domain}.<br/><br/>${adsTxtValidator.htmlSignature}` ;
        adsTxtValidator.transporter.sendMail({
            to: to,
            subject: "Missing ads.txt",
            text: h2p(mailtext),
            html: mailtext
        });
    },
    startAnalysis: function () {
        adsTxtValidator.transporter = nodemailer.createTransport({
            sendmail: true,
            newline: 'unix',
            path: '/usr/sbin/sendmail'
        });
        let pageSet = JSON.parse(fs.readFileSync(`${URL_TO_PAGE_CONFIGS}`, 'utf8'));
        adsTxtValidator.observeArray.forEach(function (url) {
            let checklist = adsTxtValidator.get(url).split("\n");
            pageSet.forEach(function (page) {
                if (page.active && page['Site Name'].indexOf('App') === -1) {
                    let domain = page['Site Domain'].replace("motorsport.com", "de.motorsport.com");
                    if (!domain.match(/.*?\..*?\..*/)) {
                        domain = "www." + domain;
                    }
                    let entries = adsTxtValidator.compare(checklist, domain, page);
                    if (entries.length) {
                        adsTxtValidator.report(domain, entries, page["Objectmanager Mailadress"]);
                    }
                }
            });
        });
    }
}

module.exports = adsTxtValidator;
