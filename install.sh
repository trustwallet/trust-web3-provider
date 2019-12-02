echo '\ngetting Trust WalletLink...'
if [ -d walletlink ]; then
    git submodule foreach git pull origin master
else
    git submodule add git@github.com:trustwallet/walletlink.git
fi
cd  walletlink/js

echo '\nInstalling dependencies...'
npm install

echo '\nRunning tests...'
npm run test

echo '\nBuilding project...'
npm run build