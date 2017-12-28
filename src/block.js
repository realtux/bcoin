// Copyright (c) 2017 Brian Seymour
// Distributed under the MIT software license, see the accompanying
// file "license" or http://www.opensource.org/licenses/mit-license.php.

require('nocamel');

const crypto = require('crypto');
const cp = require('child_process');
const fs = require('fs');

const Transaction = require('./transaction');

class Block {

    constructor() {
        this.height = null;
        this.timestamp = null;
        this.prev = null;
        this.difficulty = null;
        this.mint_to = null;
        this.txs = [];
    }

    init_new() {
        let prev_height = cp.execSync('ls blockchain/blocks | sort -nr | head -1').toString().trim();
        let prev_block = fs.read_file_sync('blockchain/blocks/' + prev_height);

        this.height = +prev_height.split('.')[0] + 1;
        this.timestamp = +new Date();
        this.prev = /sol_hash: ([a-z0-9]+)/.exec(prev_block.toString())[1];
        this.difficulty = 5;
        this.mint_to = '';
        this.txs = [];
    }

    init_from(block) {

    }

    add_tx(txs) {
        txs = Array.isArray(txs) ? txs : [txs];

        txs.forEach(tx => {
            var transaction = new Transaction();
            transaction.parse(tx);

            if (transaction.authenticated()) {
                this.txs.push(transaction);
                this.compute_input_hash();
            }
        });
    }

    add_mint(addr) {
        this.mint_to = addr;
        this.compute_input_hash();
    }

    is_valid() {
        // verify hash matches previous block num

        // verify txs_hash matches hashing the txs

        // verify mint_to rewards only 1.00000000 bcoin

        return true;
    }

    is_solved() {
        let is_valid = this.is_valid();

        // verify nonce is the correct one
        let solved = this.test_nonce(this.sol_nonce);

        return is_valid && solved;
    }

    compute_input_hash() {
        var buffer = '';

        this.txs.forEach(tx => buffer += tx.tx_signed + '\n');
        buffer += 'mint_to: ' + this.mint_to + ' 1.00000000';

        this.txs_hash = crypto.createHash('sha256').update(buffer).digest('hex');
    }

    test_nonce(nonce) {
        var hash = crypto
            .createHash('sha256')
            .update(this.header + ' ' + nonce)
            .digest('hex');

        if (hash.slice(0, this.difficulty) === new Array(this.difficulty+1).join('0')) {
            this.sol_nonce = nonce;
            this.sol_hash = hash;
            return true;
        }

        return false;
    }

    emit() {
        console.log('h: ' + this.header);
        this.txs.forEach(tx => console.log(tx.tx_signed));
        console.log('mint_to: ' + this.mint_to + ' 1.00000000');
        console.log('sol_hash: ' + this.sol_hash);
        console.log('sol_nonce: ' + this.sol_nonce);
    }

    persist() {
        var buffer =
            'h: ' + this.header + '\n' +
            this.txs.map(tx => tx.tx_signed).join('\n') + (this.txs.length > 0 ? '\n' : '') +
            'mint_to: ' + this.mint_to + ' 1.00000000' + '\n' +
            'sol_hash: ' + this.sol_hash + '\n' +
            'sol_nonce: ' + this.sol_nonce + '\n';

        fs.write_file_sync('blockchain/blocks/' + this.height + '.dat', buffer);
    }

    get header() {
        return this.height + ' ' +
            this.timestamp + ' ' +
            this.prev + ' ' +
            this.difficulty + ' ' +
            (this.txs.length + 1) + ' ' +
            this.txs_hash;
    }

}

module.exports = Block;
