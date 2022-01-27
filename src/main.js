const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
const { Blockchain, Transaction } = require('./blockchain');

// Your private key goes here.
// NOTE: If you haven't built your private key yet, build it from keygenerator.js file.
const myKeyPair = ec.keyFromPrivate('878cfb084a99917eda040c5972274c613be42e0fe08835bebeaadc717cee6b94');

// From that we can calculate your public key (which doubles as your wallet address).
const myWalletAddress = myKeyPair.getPublic('hex');

// Create new instance of Blockchain class.
const myBlockChain = new Blockchain();

// Mine first block (mining reward = 100 coins).
// NOTE: Here, myWalletAddress plays as a miner that will be rewarded with 100 coins!
myBlockChain.minePendingTransactions(myWalletAddress);

// Create a transaction & sign it with your key.
// NOTE: Here, myWalletAddress plays as a user wallet that wants to transfer some coins.
const tx1 = new Transaction(myWalletAddress, 'address2', 100);
tx1.signTransaction(myKeyPair);
myBlockChain.addTransaction(tx1);

// Mine block (mining reward = 100 coins).
myBlockChain.minePendingTransactions(myWalletAddress);

// Create second transaction.
const tx2 = new Transaction(myWalletAddress, 'address3', 50);
tx2.signTransaction(myKeyPair);
myBlockChain.addTransaction(tx2);

// Mine block (mining reward = 100 coins).
myBlockChain.minePendingTransactions(myWalletAddress);

console.log();
console.log(`Balance of myWalletAddress is ${myBlockChain.getBalanceOfAddress(myWalletAddress)}`);
console.log(`Balance of address2 is ${myBlockChain.getBalanceOfAddress('address2')}`);
console.log(`Balance of address3 is ${myBlockChain.getBalanceOfAddress('address3')}`);

// Uncomment this line if you want to test tampering with the chain.
// myBlockChain.chain[1].transactions[0].amount = 10;

// Check if the chain is valid
console.log();
console.log('Blockchain valid?', myBlockChain.isChainValid() ? 'Yes' : 'No');
