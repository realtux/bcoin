// Copyright (c) 2017 Brian Seymour
// Distributed under the MIT software license, see the accompanying
// file "license" or http://www.opensource.org/licenses/mit-license.php.

require('nocamel');

const base58 = require('base-58');
const crypto = require('crypto');
const cp = require('child_process');
const fs = require('fs');
const request = require('request-promise');

const config = require('./config');

const menu = () => {
console.log(`
bcoin wallet manager
--------------------

commands:
    --gen-private-key
        generate a new private key and bcoin address

    --get-public-key
        get the raw public key which corresponds to your private key

    --gen-address
        get your bcoin address for people to send you bcoin

    --send [addr] [amount]
        sends bcoin to an address
`);
};

if (process.argv.length <= 2) {
    menu();
    return;
}

switch (process.argv[2]) {
    case '--gen-private-key':
        if (fs.existsSync('wallet/private.key')) {
            console.log('private.key exists, please delete if you really want to create a new one');
            return;
        }

        cp.execSync('openssl genrsa -out wallet/private.key > /dev/null 2>&1');
        cp.execSync('openssl rsa -in wallet/private.key -pubout > wallet/public.key');
        break;

    case '--get-public-key':
        if (!fs.existsSync('wallet/private.key')) {
            console.log('generate a private key first, use --gen-private-key');
            return;
        }

        var pub_key = cp.execSync('openssl rsa -in wallet/private.key -pubout 2>/dev/null')
            .toString()
            .trim()
            .split('\n')
            .slice(1, -1)
            .join('')
            .trim();

        console.log(pub_key.trim());

        break;

    case '--get-address':
        if (!fs.existsSync('wallet/private.key')) {
            console.log('generate a private key first, use --gen-private-key');
            return;
        }

        var pub_key = cp.execSync('openssl rsa -in wallet/private.key -pubout 2>/dev/null')
            .toString()
            .trim()
            .split('\n')
            .slice(1, -1)
            .join('')
            .trim();

        // get the pub key from the pk
        var address = base58.encode(crypto.createHash('sha256').update(pub_key).digest());
        console.log(address.trim());

        break;

    case '--send':
        var from = cp.execSync('bin/wallet --get-address').toString().trim();
        var to = process.argv[3];
        var amt = (+process.argv[4]).to_fixed(8);
        var pub = cp.execSync('bin/wallet --get-public-key').toString().trim();
        var tx =
            'from: ' + from + ' ' + amt + '\n' +
            'to: ' + to + ' ' + amt

        // write tx
        fs.writeFileSync('tmp/tx', tx);

        // generate signature
        cp.execSync('openssl dgst -sha256 -sign wallet/private.key -out tmp/sig tmp/tx');
        cp.execSync('openssl base64 -in tmp/sig -out tmp/sig_b64');

        tx += '\n' + 'sig: ' + pub + ' ' + fs.readFileSync('tmp/sig_b64').toString().trim().split('\n').join('');

        fs.unlinkSync('tmp/tx');
        fs.unlinkSync('tmp/sig');
        fs.unlinkSync('tmp/sig_b64');

        request
            ({
                method: 'POST',
                url: 'http://' + config.master_node.host + ':' + config.master_node.port + '/new_tx',
                json: true,
                body: {
                    tx
                }
            })
            .then(console.log);

        break;

    default:
        menu();
        break;
}
