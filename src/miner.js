const net = require('net');

const Transaction = require('./transaction');
const Block = require('./block');

const node = net.createConnection(4343, '192.168.86.10');

node
    .on('connect', () => {
        // get pending tx (if any) to mine
        node.write(JSON.stringify({
            action: 'pending_tx'
        }));
    })
    .on('data', data => {
        // get some pending transactions
        var json;

        try {
            json = JSON.parse(data);
        } catch (e) { }

        node.end();

        var txs = json.txs;

        if (!txs) return;

        // start a new block
        var block = new Block();
        block.init_new();
        block.add_mint('EtvmzPdyfZvXnr1QEtKgMN4hhaviZ54V7FynAUsm9o9Z');
        block.add_tx(txs);

        for (var i = 0; i <= 2147483648; ++i)
            if (block.test_nonce(i))
                break;

        block.emit();
        block.persist();
        //block.broadcast();

        console.log(block.is_valid());
        console.log(block.is_solved());
    })
    .on('error', () => {});
