echo '\ngetting Trust WalletLink...'
if [ -d walletlink ]; then
    git submodule foreach git pull origin master
else
    git submodule add git@github.com:trustwallet/walletlink.git
fi
cd  walletlink/js

echo '\nInstalling dependencies...'
npm install

sh  ../../build.sh