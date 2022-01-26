//#region imports

// The crypto module provides cryptographic functionality that includes a set of 
// wrappers for OpenSSL's hash, HMAC, cipher, decipher, sign, and verify functions.
const crypto = require('crypto');

// Source: https://github.com/indutny/elliptic.
// ec implements ECDSA (Elliptic Curve Digital Signature Algorithm).
// ECDSA is the signature algorithm used in bitcoin and ethereum to sign transactions.
const EC = require('elliptic').ec;

// ECDSA with secp256k1 curve (https://safecurves.cr.yp.to.
const ec = new EC('secp256k1');

//#endregion

//#region Transaction

/**
 * Peer-to-peer found transfer operation to be included in the ledger (block).
 */
class Transaction {
    /**
     * Create a new instance of this class.
     * 
     * @param {string} fromAddress The address (public key) where the `amount` to be transferred comes from.
     * @param {string} toAddress The address (public key) to which you want to transfer the `amount`.
     * @param {number} amount Amount to transfer.
     */
    constructor(fromAddress, toAddress, amount) {
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.amount = amount;
        this.timestamp = Date.now();
    }

    /**
     * Creates a SHA256 hash of the transaction.
     *
     * @returns {string} The transaction hash.
     */
    calculateHash() {
        return crypto.createHash('sha256').update(
            this.fromAddress +
            this.toAddress +
            this.amount +
            this.timestamp).digest('hex');
    }

    /**
     * Signs a transaction with the given signingKey (which is an Elliptic keypair object 
     * that contains a private key). The signature is then stored inside the transaction 
     * object and later stored on the blockchain.
     * 
     * @param {EC.KeyPair} signingKey The EC.KeyPair to sign the transaction.
     */
    signTransaction(signingKey) {
        // You can only send a transaction from the wallet that is linked to your
        // key. So here we check if the fromAddress matches your publicKey.
        if (signingKey.getPublic('hex') !== this.fromAddress) {
            throw new Error('You cannot sign transactions for other wallets!');
        }

        // Calculate the hash of this transaction, sign it with the key and store it 
        // inside the transaction obect.
        const hashTx = this.calculateHash();
        const sig = signingKey.sign(hashTx, 'base64');

        this.signature = sig.toDER('hex');
    }

    /**
     * Checks if the signature is valid (transaction has not been tampered with).
     * It uses the fromAddress as the public key.
     *
     * @returns {boolean} True, if the transaction is valid. Otherwise, false.
     */
    isValid() {
        // If the transaction doesn't have a from address we assume it's a
        // mining reward and that it's valid. You could verify this in a
        // different way (special field for instance).
        if (this.fromAddress === null) return true;

        if (!this.signature || this.signature.length === 0) {
            throw new Error('No signature in this transaction');
        }

        // Create a key from the public key (the from address).
        const publicKey = ec.keyFromPublic(this.fromAddress, 'hex');

        // Verify that the hash of the transaction has been signed by this signature.
        return publicKey.verify(this.calculateHash(), this.signature);
    }
}

//#endregion

//#region Block

/**
 * Data structure that contains the header and transactions of the block.
 */
class Block {
    /**
     * Create a new instance of this class.
     * 
     * @param {number} timestamp Block creation date.
     * @param {Transaction[]} transactions Transactions to be included into the block.
     * @param {string} previousHash The hash of the previous block (to "chain" the block).
     */
    constructor(timestamp, transactions, previousHash = '') {
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.nonce = 0;
        this.hash = this.calculateHash();

        // TODO: Implement the markle root (transactionRoot).
    }

    /**
     * Creates the SHA256 of this block (by processing all the data stored inside this block).
     *
     * @returns {string} The block hash.
     */
    calculateHash() {
        return crypto.createHash('sha256').update(
            this.previousHash +
            this.timestamp +
            JSON.stringify(this.transactions) +
            this.nonce).digest('hex');
    }

    /**
     * Starts the mining process on the block. It changes the 'nonce' until the hash of the block
     * starts with enough zeros as defined in difficulty (Proof of work).
     *
     * @param {number} difficulty The amount of 0 to add difficulty to the hash calculation.
     */
    mineBlock(difficulty) {
        while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join('0')) {
            this.nonce++;
            this.hash = this.calculateHash();
        }

        console.debug(`Block mined (with nonce: ${this.nonce}): ${this.hash}`);
    }

    /**
     * Validates all the transactions inside this block (signature + hash) and returns true
     * if everything checks out. False if the block is invalid.
     *
     * @returns {boolean} True, if all the transactions in the block are valid. Otherwise, false.
     */
    hasValidTransactions() {
        for (const tx of this.transactions) {
            if (!tx.isValid()) {
                return false;
            }
        }

        return true;
    }
}

//#endregion

//#region Blockchain

/**
 * Data structure that contains all the blocks.
 */
class Blockchain {
    /**
     * Create a new instance of this class with the Genesis block.
     */
    constructor() {
        this.chain = [this.createGenesisBlock()];
        this.difficulty = 2;
        this.pendingTransactions = [];
        this.miningReward = 100;
    }

    /**
     * Create the Genesis block.
     * @returns A new block with "genesis" data.
     */
    createGenesisBlock() {
        return new Block('01/01/2022', 'Genesis block', '0');
    }

    /**
     * Returns the latest block on our chain. Useful when you want to create a new Block and 
     * you need the hash of the previous Block.
     *
     * @returns {Block} The last block.
     */
    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    /**
     * Takes all the pending transactions, puts them in a Block and starts the mining process (PoW). 
     * It also adds a transaction to send the mining reward to the given address.
     *
     * @param {string} miningRewardAddress The address of the miner to transfer the reward.
     */
    minePendingTransactions(miningRewardAddress) {
        // NOTE: In a real blockchain, not all pending transactions can be added to the block because 
        // there are many and also the block must have a certain size (eg: BCN = 1MB). It is handled 
        // by having a mempool where the miner can selects the most convenient transactions.

        const rewardTx = new Transaction(null, miningRewardAddress, this.miningReward);
        this.pendingTransactions.push(rewardTx);

        const block = new Block(Date.now(), this.pendingTransactions, this.getLatestBlock().hash);
        block.mineBlock(this.difficulty);

        console.debug('Block successfully mined!');
        this.chain.push(block);

        this.pendingTransactions = [];
    }

    /**
     * Verifies that the given transaction is properly signed, then add the new 
     * transaction to the list of pending transactions (to be added next time the 
     * mining process starts).
     *
     * @param {Transaction} transaction The transaction to be added.
     */
    addTransaction(transaction) {
        // Check the addresses of the transaction.
        if (!transaction.fromAddress || !transaction.toAddress) {
            throw new Error('Transaction must include from and to address');
        }

        // Verify the transaction signature.
        if (!transaction.isValid()) {
            throw new Error('Cannot add invalid transaction to chain');
        }

        // Transaction amount should be higher than 0.
        if (transaction.amount <= 0) {
            throw new Error('Transaction amount should be higher than 0');
        }

        // Making sure that the amount sent is not greater than existing balance.
        if (this.getBalanceOfAddress(transaction.fromAddress) < transaction.amount) {
            throw new Error('Not enough balance');
        }

        this.pendingTransactions.push(transaction);
        console.debug('transaction added: %s', transaction);
    }

    /**
     * Returns the balance of a given wallet address.
     *
     * @param {string} address The address to get the balance.
     * @returns {number} The actual balance of the wallet.
     */
    getBalanceOfAddress(address) {
        let balance = 0;

        for (const block of this.chain) {
            for (const trans of block.transactions) {
                if (trans.fromAddress === address) {
                    balance -= trans.amount;
                }

                if (trans.toAddress === address) {
                    balance += trans.amount;
                }
            }
        }

        console.debug(`\ngetBalanceOfAdrees(${address}): %s`, balance);
        return balance;
    }

    /**
     * Returns a list of all transactions that were made to and from the given wallet address.
     *
     * @param  {string} address The address to get the transactions.
     * @returns {Transaction[]} The list of transactions.
     */
    getAllTransactionsForWallet(address) {
        const txs = [];

        for (const block of this.chain) {
            for (const tx of block.transactions) {
                if (tx.fromAddress === address || tx.toAddress === address) {
                    txs.push(tx);
                }
            }
        }

        console.debug('get transactions for wallet count: %s', txs.length);
        return txs;
    }

    /**
     * Loops over all the blocks in the chain and verify if they are properly
     * linked together and nobody has tampered with the hashes. By checking
     * the blocks it also verifies the (signed) transactions inside of them.
     *
     * @returns {boolean} True, if the chain is valid. Otherwise, false.
     */
    isChainValid() {
        // Check if the Genesis block hasn't been tampered with by comparing the output of
        // createGenesisBlock with the first block on our chain.
        const realGenesis = JSON.stringify(this.createGenesisBlock());

        if (realGenesis !== JSON.stringify(this.chain[0])) {
            return false;
        }

        // Check the remaining blocks on the chain to see if there hashes and signatures 
        // are correct.
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            if (previousBlock.hash !== currentBlock.previousHash) {
                return false;
            }

            if (!currentBlock.hasValidTransactions()) {
                return false;
            }

            if (currentBlock.hash !== currentBlock.calculateHash()) {
                return false;
            }
        }

        return true;
    }
}

//#endregion

module.exports.Blockchain = Blockchain;
module.exports.Block = Block;
module.exports.Transaction = Transaction;
