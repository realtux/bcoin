const crypto = require('crypto');

var Block = function(block) {
    Object.keys(block).forEach(key => {
        this[key] = block[key];
    });
};

Block.prototype.header = function() {
    return this.version + '' + this.timestamp + this.prev + this.inputs + this.input_hash;
};

Block.prototype.test = function(nonce) {
    var hash = crypto
        .createHash('sha256')
        .update(this.header() + nonce)
        .digest('hex');

    if (hash.slice(0, this.difficulty) === new Array(this.difficulty+1).join('0')) {
        this.nonce = nonce;
        this.block_hash = hash;
        return true;
    }

    return false;
};

var genesis_block = new Block({
    version: 1,
    timestamp: 1513150089910,
    prev: '0000000000000000000000000000000000000000000000000000000000000000',
    difficulty: 5,
    inputs: 3,
    input_hash: '509f4ecb21dbb57c42df28efd0bab8b38e5604b189b2da0f17d0986d22cd1f1d',
    input_data: [
        '173.21.85.32@040241-07:00: welcome to mini chain :)',
        '173.21.85.32@040312-07:00: this is a new block',
        '173.21.85.32@040234-07:00: cool, eh?',
    ],
    block_hash: '00000e0da50f6c5fe86ab6d37bf3beee04b7b49ccfc0d0c47f732e1344f37597',
    nonce: 338835,
    header() {
        return this.version + '' + this.timestamp + this.prev + this.difficulty + this.inputs + this.input_hash;
    }
});

for (var i = 0; i <= 2147483648; ++i)
    if (genesis_block.test(i))
        break;

console.log(genesis_block);
console.log(genesis_block.test(genesis_block.nonce));
