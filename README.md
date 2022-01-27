# MyBlockChain

[![.github/workflows/ci.yml](https://github.com/ehsomma/myblockchain/actions/workflows/ci.yml/badge.svg)](https://github.com/ehsomma/myblockchain/actions/workflows/ci.yml)
[![Coverage Status](https://coveralls.io/repos/github/ehsomma/myblockchain/badge.svg?branch=master)](https://coveralls.io/github/ehsomma/myblockchain?branch=master)
[![GitHub Issues](https://img.shields.io/github/issues/ehsomma/myblockchain)](https://github.com/ehsomma/myblockchain/issues)
[![License](https://img.shields.io/badge/license-MIT-informational)](/LICENSE)

This project implements a basic blockchain in JavaScript for research purposes to understand its inner workings. This is by no means a complete implementation and it is by no means secure.

## Features

* Generate wallet (private/public key).
* Sign transactions.
* Genesis block.
* Add transactions to the block.
* Simple proof-of-work algorithm (mining).
* Verify blockchain (to prevent tampering).

## Getting Started <a name = "getting-started"></a>
### Fork or download the repo
<br>

### Install the dependencies
```
npm install
```

### Generate a keypair

To make transactions on this blockchain you need a **keypair** (private and public key). The public key becomes your wallet address and the private key is used to sign transactions (see: keygenerator.js).

```js
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const myKeyPair = ec.genKeyPair();
```

The myKey object now contains your public & private key:

```js
console.log('Public key:', myKeyPair.getPublic('hex'));
console.log('Private key:', myKeyPair.getPrivate('hex'));
```

### Create a blockchain instance
Now you can create a new instance of a Blockchain:

```js
const {Blockchain, Transaction} = require('blockchain');
const myChain = new Blockchain();
```

### Adding transactions
```js
// Transfer 100 coins from my wallet to "<toAddress1>".
// NOTE: <toAddress> should be another public key.
const tx = new Transaction(myKeyPair.getPublic('hex'), '<toAddress1>', 100);
tx.signTransaction(myKeyPair);
myChain.addTransaction(tx);
```

### Mining blocks
To finalize this transaction, we have to mine a new block:

```js
myChain.minePendingTransactions('<minerAddress>');
```

## Example
Take a look or run the [main.js](https://github.com/ehsomma/myblockchain/blob/master/src/main.js) file to see step by step the full process.
```
cd src
node main.js
```

## Original project <a name = "original-project"></a>
This project is baseo on [SavjeeCoin](https://github.com/Savjee/SavjeeCoin) project.

Modifications to the original project:
* Full documentation on classes, methods and parameters.
* Additional documentation.
* Added eslint rules to force documentation (jsdoc).

## TODO:

- [ ] Add TransactionsRoot field to the block header (Merkle tree).
- [ ] Generate keypairs by mnemonic phrase.