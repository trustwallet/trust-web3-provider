echo '\ngetting Trust WalletLink...'
if [ -d src ]; then
    cd  src

    git pull git@github.com:dpereskokov/walletlink.git
else
    mkdir -p src
    cd  src

    git clone git@github.com:dpereskokov/walletlink.git .
fi
cd  js

echo '\nInstalling dependencies...'
npm install

echo '\nBuilding project...'
npm run build