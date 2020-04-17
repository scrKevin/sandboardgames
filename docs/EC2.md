# AWS EC2

Preliminary testing seems to indicate a `t3.micro` instance (at ± \$ 0.01 per
hour) is more than sufficient to run multiple games simultaneously.

## Installation Instructions

For now as an annotated shell-script (assuming the standard **Amazon Ubuntu
18.04 LTS** image):

```shell
# Apt upgrade

sudo apt update
sudo apt upgrade

# If Grub encounters a conflict in "menu.lst" during the upgrade, issue the
# below commands to resolve it. It doesn't matter what option you choose during
# the upgrade process itself...

sudo rm /boot/grub/menu.lst
update-grub-legacy-ec2 -y

# Install Node 13.x

curl -sL https://deb.nodesource.com/setup_13.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install sandboardgames

sudo apt install git

cd ~/
git clone https://github.com/scrKevin/sandboardgames.git

cd sandboardgames

npm install

# Install Certbot

sudo add-apt-repository ppa:certbot/certbot
sudo apt-get update
sudo apt-get install certbot

# At this point you'll need to make sure you have port 80 open in your Security
# Group and the (sub)domain you want to use for the certificate pointing to the
# pubic IP-address of the EC2-machine. Update the line below to match the
# (sub)domain you want to use.

domain="example.com"
sudo certbot certonly --standalone

# Ensure our "ubuntu" user can access the certificates

sudo chmod 0755 /etc/letsencrypt/{live,archive}
sudo chgrp ubuntu /etc/letsencrypt/live/$domain/privkey.pem
sudo chmod 0640 /etc/letsencrypt/live/$domain/privkey.pem

# Symlink the certificates into the sandboardgames installation

ln -s /etc/letsencrypt/live/$domain/fullchain.pem security/fullchain.pem
ln -s /etc/letsencrypt/live/$domain/privkey.pem security/privkey.pem

# Setup sandboardgames as a service (using forever-service)

sudo npm install -g forever forever-service

sudo forever-service install sandboardgames \
  -s /home/ubuntu/sandboardgames/index.js \
  -f " --workingDir /home/ubuntu/sandboardgames" \
  -e "PORT=443 NODE_ENV=production"

# Ensure Node can bind to port 443 (https://superuser.com/q/710253)

sudo setcap CAP_NET_BIND_SERVICE=+eip /usr/bin/node

# Start the server - this is just a test-run; for normal operations we rely on
# the service we just installed. Ensure you have port 443 open in your Security
# Group. You can close port 80 again if you wish.

export PORT=443
npm start

# Press Ctrl+C to terminate the server and execute the below command to restart
# the machine - after the reboot, the sandboardgames-service should come up
# automatically... Enjoy!

sudo shutdown -r now
```
