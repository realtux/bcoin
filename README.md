# bcoin
The cute little blockchain of your dreams

bcoin is a fully functional cryptocurrency/blockchain demostration. It is written in JavaScript and is much easier to understand than, for instance, the Bitcoin client in C++. Though not nearly as robust as Bitcoin, it does implement all (or nearly all) of the key components necessary to operate a decentralized currency. Probably with a thorough review, auditing, a substantial increase in difficulty, and choosing a memory hard algo (to prevent ASIC mining), it could operate as a legit cryptocurrency.

---

### Major components implemented are:
- **Blockchain**
  - Crytographically secure
  - Block difficulty
  - Currency transactions
  - Double spend detection

- **Node**
  - Decentralized/P2P
  - Maintains full copy of blockchain
  - Auto syncing
  - Chain reconciliation
  - Responds to peer, wallet, and miner requests

- **Wallet**
  - Private/public key generator
  - Base58 derived address (like BTC)
  - Digital transaction signing
  - Balance

- **Miner**
  - CPU Mining
  - SHA256
  - Retrieves transactions from node
  - Propagates nonce solution and block hash to node
  
---
  
#### Because this is mostly for demonstration, there are some things to be aware of:
- A master node is used to sync new nodes with eachother. This is done because usually in a demonstration, nobody is actually using it and there is no great way to find nodes. Bitcoin does something similar with a DNS record which points to a known Bitcoin node. However, if you use the master node to sync, say, three other nodes, you can then remove the master node from play because the other nodes will store previous connections and try to reconnect to those nodes.
- No resistance to a 51% attack. For demonstration purposes, block difficulty is 5 which means 1 CPU can solve a block in about 5-10 seconds. This means that the whole initial chain could be rewritten in a matter of minutes.
- Block data is all text based and text processed. No attempt was made at optimization.
- Wallet balance is inferred by summing the outputs and inputs across all blocks, and subtracting the latter from the former for a given address. This would most assuredly be inefficient on a huge block list.
