const request = require('request-promise');

const Transaction = require('./transaction');
const Block = require('./block');

const MASTER_NODE = '104.197.55.138';
//const MASTER_NODE = '192.168.86.10';
const NODE_PORT = 4343;

request
    ({
        method: 'POST',
        url: 'http://' + MASTER_NODE + ':' + NODE_PORT + '/pending_tx',
        json: true
    })
    .then(json => {
        var txs = json.txs;

        if (!txs) return;

        // start a new block
        var block = new Block();
        block.init_new();
        block.add_mint('8TUZUuFuTisKv5oQ9jSLDDsGm9pCbyDrYEMcMr2Kia29');
        block.add_tx(txs);

        for (var i = 0; i <= 2147483648; ++i)
            if (block.test_nonce(i))
                break;

        block.emit();
        block.persist();
        //block.broadcast();

        console.log(block.is_valid());
        console.log(block.is_solved());
    });
