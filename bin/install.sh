#!/bin/sh

chmod 0600 test/.wcryptpass
bin/get-fonts.js
bin/browserify.js
export WCRYPT_PASSFILE=test/.wcryptpass
MULTIHASH=`bin/ipfsecret.js add -wrn test`
cd ./examples
export WCRYPT_PASSFILE=../test/.wcryptpass
../bin/ipfsecret.js get "$MULTIHASH"
ipfs get "$MULTIHASH"
cd ..
