// Source: https://github.com/indutny/elliptic.
// ec implements ECDSA (Elliptic Curve Digital Signature Algorithm).
// ECDSA is the signature algorithm used in bitcoin and ethereum to sign transactions.
const EC = require('elliptic').ec;

// ECDSA with secp256k1 curve (https://safecurves.cr.yp.to.
const ec = new EC('secp256k1');

// Generate a new key pair and convert them to hex-strings.
const myKeyPair = ec.genKeyPair();
const publicKey = myKeyPair.getPublic('hex');
const privateKey = myKeyPair.getPrivate('hex');

// Print the keys to the console.
console.log();
console.log('Your public key (also your wallet address, freely shareable):\n', publicKey);

console.log();
console.log('Your private key (keep this secret! To sign transactions):\n', privateKey);
