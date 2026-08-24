const crypto = require('crypto');
function disc(name) {
    return crypto.createHash('sha256').update(`global:${name}`).digest().slice(0, 8);
}
console.log("delegate_account:", disc("delegate_account").toJSON().data);
console.log("commit_and_undelegate:", disc("commit_and_undelegate").toJSON().data);
