console.log('bcoin');
console.log('-----');

const colors = require('colors/safe');
const net = require('net');
const fs = require('fs');

const Transaction = require('./transaction');

const MASTER_NODE = '104.197.55.138';
const NODE_PORT = 4343;
const MIN_NODES = 2;

const name = process.env.NODE_NAME || 'default';

var nodes = [];

var pending_tx = [];

// try to load previously known nodes
try {
    var data = fs.readFileSync('nodes-' + name + '.json');
    nodes = JSON.parse(data);
} catch (e) {}

const add_node = node => {
    !~nodes.indexOf(node) && nodes.push(node);
    fs.writeFileSync('nodes-' + name + '.json', JSON.stringify(nodes));
};

const remove_node = node => {
    ~nodes.indexOf(node) && nodes.splice(nodes.indexOf(node), 1);
    fs.writeFileSync('nodes-' + name + '.json', JSON.stringify(nodes));
};

const handle = s => {
    const ip = s.remoteAddress.replace(/^.*:/, '');

    s.on('data', data => {
        // bail on invalid json
        try {
            const json = JSON.parse(data);

            // handle an incoming action
            switch (json.action) {
                case 'node_list':
                    add_node(ip);
                    s.write(JSON.stringify({
                        own_ip: ip,
                        nodes: nodes.filter(node => node !== ip)
                    }));
                    break;
                case 'new_node':
                    add_node(ip);

                    // new node notice should only propagate once
                    json.propagations > 0 && node_propagation(json.propagations);
                    break;
                case 'new_tx':
                    var transaction = new Transaction();
                    transaction.parse(json.tx);

                    if (transaction.authenticated()) {
                        console.log(colors.green('valid transaction received'));


                        !pending_tx.some(tx => tx === transaction.tx_signed) &&
                            pending_tx.push(transaction.tx_signed);

                        s.write(JSON.stringify({
                            result: 'accepted'
                        }));
                    } else {
                        console.log(colors.red('invalid transaction received'));
                        s.write(JSON.stringify({
                            result: 'rejected'
                        }));
                    }
                    break;
                case 'pending_tx':
                    s.write(JSON.stringify({
                        txs: pending_tx
                    }));
                    break;
            }
        } catch (e) {
            console.log(colors.cyan(ip) + colors.red(' sent invalid json'));
        }
    });
};

const start_server = () => {
    net.createServer(handle).listen(NODE_PORT);
    console.log(colors.green('server started on port ' + NODE_PORT));
};

const node_propagation = propagations => {
    nodes.forEach(node => {
        const conn = net.createConnection(NODE_PORT, node);

        conn
            .on('connect', () => {
                conn.write(JSON.stringify({
                    action: 'new_node',
                    propagations: --propagations
                }));
            })
            .on('error', () => {});
    });
};

const node_heartbeat = () => {
    console.log('processing heartbeat: ' + nodes.join(' // '));

    // check state of nodes
    nodes.forEach(node => {
        const node_node = net.createConnection(NODE_PORT, node);

        node_node
            .on('connect', () => {
                console.log(colors.cyan(node) + colors.green(' alive'));
                node_node.write('');
            })
            .on('error', () => {
                console.log(colors.cyan(node) + colors.red(' dead'));

                // remove dead node, unless master
                if (node !== MASTER_NODE) {
                    remove_node(node);
                }
            });
    });

    // if this node knows of < MIN_NODES, request node lists from each node it knows of
    if (nodes.length < MIN_NODES) {
        nodes.forEach(node => {
            const node_node = net.createConnection(NODE_PORT, node);

            node_node
                .on('connect', () => {
                    node_node.write(JSON.stringify({
                        action: 'node_list'
                    }));
                })
                .on('data', data => {
                    var json;

                    try {
                        json = JSON.parse(data);
                    } catch (e) {
                        return null;
                    }

                    // notify all nodes of a new node
                    json.nodes.forEach(node => {
                        const node_node = net.createConnection(NODE_PORT, node);

                        node_node
                            .on('connect', () => {
                                add_node(node);

                                node_node.write(JSON.stringify({
                                    action: 'new_node',
                                    propagations: 5
                                }));
                            })
                            .on('error', () => {});
                    });
                })
                .on('error', () => {
                    // remove dead node
                    remove_node(node);
                });
        });
    }
};

start_server();

if (nodes.length === 0 || process.argv[2] !== '--master') { // connect to master node instead
    const master_node = net.createConnection(NODE_PORT, MASTER_NODE);

    master_node
        .on('connect', () => {
            master_node.write(JSON.stringify({
                action: 'node_list'
            }));
        })
        .on('data', data => {
            var json;

            try {
                json = JSON.parse(data);
            } catch (e) {
                process.exit();
            }

            // establish connection with all nodes
            add_node(MASTER_NODE);
            json.nodes.forEach(node => {
                const node_node = net.createConnection(NODE_PORT, node);

                node_node
                    .on('connect', () => {
                        add_node(node);

                        node_node.write(JSON.stringify({
                            action: 'new_node',
                            propagations: 5
                        }));
                    })
                    .on('error', () => {});
            });
        })
        .on('error', () => {});
}

setInterval(node_heartbeat, 5000);
