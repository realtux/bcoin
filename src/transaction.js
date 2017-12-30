// Copyright (c) 2017 Brian Seymour
// Distributed under the MIT software license, see the accompanying
// file "license" or http://www.opensource.org/licenses/mit-license.php.

require('nocamel')

const crypto = require('crypto');
const cp = require('child_process');
const fs = require('fs');

class Transaction {

    parse(tx) {
        tx = tx.split('\n');

        this.from_addr = tx[0].split(' ')[1];
        this.from_amt = tx[0].split(' ')[2];
        this.to_addr = tx[1].split(' ')[1];
        this.to_amt = tx[1].split(' ')[2];
        this.from_pub = tx[2].split(' ')[1];
        this.sig = tx[2].split(' ')[2];
    }

    is_valid() {
        /**
         * protocol enforcement
         * this is where each piece of protocol.txt as it pertains to a block is checked. any
         * failure causes block rejection
         **/

         // step 1: each tx: from and to addresses of each tx must pass regex [0-9a-zA-Z]{44}

         // step 2: each tx: from and to amounts must be positive and pass regex [0-9]+\.[0-9]{8}

         // step 3: each tx: from amount must be >= from address balance

         // step 4: from address must be able to be made from base58(sha256(pub key in sig))

         // step 5: each tx: pass an openssl message and signature integrity check
        let rand_sum = crypto
            .createHash('sha256')
            .update('' + +new Date() + Math.floor(Math.random() * 15000000))
            .digest('hex');

        // write to files for openssl
        fs.write_file_sync('tmp/' + rand_sum + '_sig_b64', this.sig_b64);
        fs.write_file_sync('tmp/' + rand_sum + '_public.key', this.from_pub_pem);
        fs.write_file_sync('tmp/' + rand_sum + '_tx', this.tx);

        // test
        var result = false;

        try {
            // decode the b64 sig to bin
            cp.execSync(
                'openssl base64 -d '+
                    '-in tmp/' + rand_sum + '_sig_b64 '+
                    '-out tmp/' + rand_sum + '_sig');

            // verify tx was signed by owner of pub key
            cp.execSync(
                'openssl dgst -sha256 '+
                    '-verify tmp/' + rand_sum + '_public.key '+
                    '-signature tmp/' + rand_sum + '_sig '+
                    'tmp/' + rand_sum + '_tx');

            result = true;
        } catch (e) { }

        fs.unlink_sync('tmp/' + rand_sum + '_sig');
        fs.unlink_sync('tmp/' + rand_sum + '_sig_b64');
        fs.unlink_sync('tmp/' + rand_sum + '_public.key');
        fs.unlink_sync('tmp/' + rand_sum + '_tx');

        return result;
    }

    // binary sig
    get sig_b64() {
        let buffer = '';

        for (let i = 0; i < this.sig.length; ++i) {
            buffer += this.sig[i];
            if ((i + 1) % 64 == 0) {
                buffer += '\n';
            }
        }

        buffer += '\n';

        return buffer;
    }

    // pem formatted public key
    get from_pub_pem() {
        let buffer = '-----BEGIN PUBLIC KEY-----\n';

        for (let i = 0; i < this.from_pub.length; ++i) {
            buffer += this.from_pub[i];
            if ((i + 1) % 64 == 0) {
                buffer += '\n';
            }
        }

        buffer = buffer.trim() + '\n-----END PUBLIC KEY-----\n';

        return buffer;
    }

    // pre-signed transaction string
    get tx() {
        return '' +
            'from: ' + this.from_addr + ' ' + this.from_amt + '\n' +
            'to: ' + this.to_addr + ' ' + this.to_amt;
    }

    // post signed transaction string
    get tx_signed() {
        return this.tx + '\n' + 'sig: ' + this.from_pub + ' ' + this.sig;
    }

}

module.exports = Transaction;
