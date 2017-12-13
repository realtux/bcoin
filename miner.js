const crypto = require('crypto');

const genesis_block = {
    version: 1,
    timestamp: 1513150089910,
    prev: '0000000000000000000000000000000000000000000000000000000000000000',
    difficulty: 4,
    inputs: 3,
    input_hash: '509f4ecb21dbb57c42df28efd0bab8b38e5604b189b2da0f17d0986d22cd1f1d',
    input_data: [
        '173.21.85.32@040241-07:00: welcome to mini chain :)',
        '173.21.85.32@040312-07:00: this is a new block',
        '173.21.85.32@040234-07:00: cool, eh?',
    ],
    block_hash: '0000015d21c17b1c57342a095050b7b6ed3415410e49a654a908f232fce5ddd1',
    nonce: 17484,
    header() {
        return this.version + '' + this.timestamp + this.prev + this.inputs + this.input_hash;
    }
};

var Block = function(block) {
    Object.keys(block).forEach(key => {
        this[key] = block[key];
    });
};

Block.prototype.header = function() {
    return this.version + '' + this.timestamp + this.prev + this.inputs + this.input_hash;
};

Block.prototype.test = function(nonce) {
    return crypto
        .createHash('sha256')
        .update(this.header() + nonce)
        .digest('hex')
        .slice(0, this.difficulty) === new Array(this.difficulty+1).join('0')
};

var active_block = new Block(genesis_block);

for (var i = 0; i <= 2147483648; ++i) {
    if (active_block.test(i)) {
        active_block.nonce = i;
        active_block.block_hash = crypto.createHash('sha256').update(active_block.header() + i).digest('hex');
        break;
    }
}

console.log(active_block);
console.log(active_block.test(active_block.nonce));
