#!/bin/bash
echo 'Enter Domain:'
read domain

# Apt upgrade
sudo apt update
sudo apt upgrade

sudo apt install -y git

# install certbot (https://github.com/vinyll/certbot-install)
curl -o- https://raw.githubusercontent.com/vinyll/certbot-install/master/install.sh | bash

# install nvm (Node version manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" 
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# install latest Node version
nvm install node

# Install sandboardgames

cd ~/
git clone https://github.com/scrKevin/sandboardgames.git

cd sandboardgames

npm install

# At this point you'll need to make sure you have port 80 open in your Security
# Group and the (sub)domain you want to use for the certificate pointing to the
# pubic IP-address of the EC2-machine.

sudo certbot certonly --standalone -d $domain

# Symlink the certificates into the sandboardgames installation

ln -s /etc/letsencrypt/live/$domain/fullchain.pem security/fullchain.pem
ln -s /etc/letsencrypt/live/$domain/privkey.pem security/privkey.pem

# Install tmux
sudo apt install -y tmux

export PORT=443

echo Install finished. Start tmux and run npm start.