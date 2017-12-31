// Copyright (c) 2017 Brian Seymour
// Distributed under the MIT software license, see the accompanying
// file "license" or http://www.opensource.org/licenses/mit-license.php.

const request = require('request-promise');

const config = require('./config');

const Transaction = require('./transaction');
const Block = require('./block');

const menu = () => {
console.log(`
bcoin miner
-----------

usage: bin/miner --address [mine_to]
`);
};

if (process.argv.length < 3) {
    return menu();
}

var address = '';

// parse args
for (var i = 2; i < process.argv.length; ++i) {
    if (process.argv.length === i+1) break;

    switch (process.argv[i]) {
        case '--address':
            address = process.argv[i+1];
            ++i;
            break;
    }
}

if (!address.match(/[a-zA-Z0-9]{44}/)) {
    console.log('supplied address appears invalid');
    return;
}

request
    ({
        method: 'POST',
        url: 'http://' + config.master_node.host + ':' + config.master_node.port + '/pending_tx',
        json: true
    })
    .then(json => {
        var txs = json.txs;

        if (!txs) return;

        if (txs.length === 0) {
            console.log('no transactions ready, mining empty block');
        } else {
            console.log(txs.length + ' transactions found, validating...');
        }

        // start a new block
        var block = new Block();
        block.init_new();
        block.add_mint(address);
        block.add_tx(txs);

        var start = new Date();
        var end = new Date();
        var last_i = 1;

        for (var i = 0; i <= 2147483648; ++i) {
            if (i % 30000 === 0) {
                end = new Date();
                var rate = (i-last_i) / ((end - start) / 1000);
                process.stdout.write('\rhashing ' + (rate / 1000).to_fixed(2) + ' mh/s              ');
                last_i = i;
                start = new Date();
            }

            if (block.test_nonce(i)) {
                process.stdout.write('\n');
                break;
            }
        }

        //block.emit();
        //block.persist();
        //block.broadcast();

        console.log(block.is_valid());
        console.log(block.is_solved());
    });
