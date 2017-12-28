// Copyright (c) 2017 Brian Seymour
// Distributed under the MIT software license, see the accompanying
// file "license" or http://www.opensource.org/licenses/mit-license.php.

console.log('bcoin node');
console.log('---------------');

require('nocamel');

const colors = require('colors/safe');
const fs = require('fs');
const express = require('express');
const body_parser = require('body-parser');
const routes = express();
const request = require('request-promise');

const Transaction = require('./transaction');

const MASTER_NODE = '104.197.55.138';
//const MASTER_NODE = '192.168.86.10';
const NODE_PORT = 4343;
const MIN_NODES = 2;

const name = process.env.NODE_NAME || 'default';

var nodes = [];

var pending_tx = [];

// try to load previously known nodes
try {
    var data = fs.read_file_sync('nodes-' + name + '.json');
    nodes = JSON.parse(data);
} catch (e) {}

const add_node = node => {
    !~nodes.index_of(node) && nodes.push(node);
    fs.writeFileSync('nodes-' + name + '.json', JSON.stringify(nodes));
};

const remove_node = node => {
    ~nodes.index_of(node) && nodes.splice(nodes.index_of(node), 1);
    fs.writeFileSync('nodes-' + name + '.json', JSON.stringify(nodes));
};

const node_propagation = propagations => {
    nodes.for_each(node => {
        request
            ({
                method: 'POST',
                url: 'http://' + node + ':' + NODE_PORT + '/new_node',
                json: true,
                body: {
                    propagations: --propagations
                }
            })
            .then(json => {console.log(json)});
    });
};

const node_heartbeat = () => {
    console.log('processing heartbeat: ' + nodes.join(' // '));

    // check state of nodes
    nodes.for_each(node => {
        request
            ({
                method: 'POST',
                url: 'http://' + node + ':' + NODE_PORT + '/heartbeat',
                json: true
            })
            .then(json => {
                console.log(colors.cyan(node) + colors.green(' alive'));
            })
            .catch(err => {
                console.log(colors.cyan(node) + colors.red(' dead'));

                // remove dead node, unless master
                if (node !== MASTER_NODE) {
                    remove_node(node);
                }
            });
    });

    // if this node knows of < MIN_NODES, request node lists from each node it knows of
    if (nodes.length < MIN_NODES) {
        nodes.for_each(node => {
            request
                ({
                    method: 'POST',
                    url: 'http://' + node + ':' + NODE_PORT + '/node_list',
                    json: true
                })
                .then(json => {
                    // notify all nodes of a new node
                    json.nodes.for_each(node => {
                        request
                            ({
                                method: 'POST',
                                url: 'http://' + node + ':' + NODE_PORT + '/new_node',
                                body: {
                                    propagations: 5
                                },
                                json: true
                            })
                            .then(json => {});
                    });
                })
                .catch(err => {
                    remove_node(node);
                });
        });
    }
};

const add_ip = (req, res, next) => {
    req.ip_formatted = req.ip.replace(/^.*:/, '');

    next();
};

routes.use(body_parser.json());
routes.use(add_ip);

routes.post('/heartbeat', (req, res) => {
    res.json({
        status: 'ok'
    });
});

routes.post('/node_list', (req, res) => {
    add_node(req.ip_formatted);

    res.json({
        own_ip: req.ip_formatted,
        nodes: nodes.filter(node => node !== req.ip_formatted)
    });
});

routes.post('/new_node', (req, res) => {
    add_node(req.ip_formatted);

    res.json({
        status: 'ok'
    });

    // new node notice should only propagate once
    req.body.propagations > 0 && node_propagation(req.body.propagations);
});

routes.post('/new_tx', (req, res) => {
    var transaction = new Transaction();
    transaction.parse(req.body.tx);

    if (transaction.authenticated()) {
        console.log(colors.green('valid transaction received'));

        !pending_tx.some(tx => tx === transaction.tx_signed) &&
            pending_tx.push(transaction.tx_signed);

        res.json({
            result: 'accepted'
        });
    } else {
        console.log(colors.red('invalid transaction received'));

        res.json({
            result: 'rejected'
        });
    }
});

routes.post('/pending_tx', (req, res) => {
    res.json({
        txs: pending_tx
    });
});

routes.listen(NODE_PORT, () => {
    console.log(colors.green('server started on port ' + NODE_PORT));

    if (nodes.length === 0 || process.argv[2] !== '--master') { // connect to master node instead
        request
            ({
                method: 'POST',
                url: 'http://' + MASTER_NODE + ':' + NODE_PORT + '/node_list',
                json: true
            })
            .then(json => {
                add_node(MASTER_NODE);

                json.nodes.for_each(node => {
                    request
                        ({
                            method: 'POST',
                            url: 'http://' + node + ':' + NODE_PORT + '/new_node',
                            json: true,
                            body: {
                                propagations: 5
                            }
                        })
                        .then(json => {});
                });
            });
    }

    setInterval(node_heartbeat, 5000);
});
