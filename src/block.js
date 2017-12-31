// Copyright (c) 2017 Brian Seymour
// Distributed under the MIT software license, see the accompanying
// file "license" or http://www.opensource.org/licenses/mit-license.php.

require('nocamel');

const crypto = require('crypto');
const cp = require('child_process');
const fs = require('fs');

const Transaction = require('./transaction');

class Block {

    static get BLOCK_REWARD() { return '1.00000000'; }

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
        var lines = block.split('\n');

        var header = lines[0].split(' ');

        this.height = +header[1];
        this.timestamp = +header[2];
        this.prev = header[3];
        this.difficulty = +header[4];
        this.txs_hash = header[6];

        for (var i = 1; i < lines.length; ++i) {
            // handle mint
            if (lines[i].match(/^mint_to: /)) {
                var mint_to = lines[i].split(' ');
                this.mint_to = mint_to[1];
                ++i;
            }

            // handle tx
            if (lines[i].match(/^from: /)) {
                var transaction = new Transaction();
                transaction.parse(lines[i] + '\n' + lines[i+1] + '\n' + lines[i+2]);

                this.txs.push(transaction);
                ++i; ++i;
            }

            // handle solution
            if (lines[i].match(/^sol_hash: /)) {
                this.sol_hash = lines[i].split(' ')[1];
                ++i;
                this.sol_nonce = lines[i].split(' ')[1];
            }
        }
    }

    add_tx(txs) {
        txs = Array.isArray(txs) ? txs : [txs];

        txs.for_each(tx => {
            var transaction = new Transaction();
            transaction.parse(tx);

            if (transaction.is_valid()) {
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
        /**
         * protocol enforcement
         * this is where each piece of protocol.txt as it pertains to a block is checked. any
         * failure causes block rejection
         **/

        // step 1: block height must be one larger than the prev block in the header
        if (!this.height) return false;

        var block_data = fs.read_file_sync('blockchain/blocks/' + (this.height - 1) + '.dat').to_string();

        var block = new Block();
        block.init_from(block_data);

        if (this.height !== block.height + 1) {
            console.log('block validity failed: height check');
            return false;
        }

        // step 2: prev block hash in header must match prev block sol_hash in chain
        if (this.prev !== block.sol_hash) {
            console.log('block validity failed: prev hash doesn\'t match prev block');
            return false;
        }

        // step 3: txs hash in header must match sha256 hash of the txs (each tx joined by \n)
        var tx_chain = this.txs.map(tx => tx.tx_signed).join('\n') + '\n' + this.mint_to_formatted;
        var txs_hash = crypto.createHash('sha256').update(tx_chain).digest('hex');

        if (this.txs_hash !== txs_hash) {
            console.log('block validity failed: txs_hash doesn\'t match txs');
            return false;
        }

        // step 4: proof of work verified
        if (!this.is_solved()) {
            console.log('block validity failed: pow not complete');
            return false;
        }

        // step 5: transaction checks
        var transactions_valid = true;

        this.txs.for_each(tx => {
            if (!tx.is_valid())
                transactions_valid = false;
        });

        if (!transactions_valid) {
            console.log('block validity failed: one or more txs failed validation');
            return false;
        }

        console.log('block #' + this.height + ': valid');
        return true;
    }

    is_solved() {
        // verify nonce is the correct one
        return this.test_nonce(this.sol_nonce);
    }

    compute_input_hash() {
        var buffer = '';

        this.txs.for_each(tx => buffer += tx.tx_signed + '\n');
        buffer += this.mint_to_formatted;

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
        this.txs.for_each(tx => console.log(tx.tx_signed));
        console.log(this.mint_to_formatted);
        console.log('sol_hash: ' + this.sol_hash);
        console.log('sol_nonce: ' + this.sol_nonce);
    }

    persist() {
        var buffer =
            'h: ' + this.header + '\n' +
            this.txs.map(tx => tx.tx_signed).join('\n') + (this.txs.length > 0 ? '\n' : '') +
            this.mint_to_formatted + '\n' +
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

    get mint_to_formatted() {
        return 'mint_to: ' + this.mint_to + ' ' + Block.BLOCK_REWARD;
    }

}

module.exports = Block;
