# Sandboardgames
Sandbox style board game engine written in NodeJS. P2P Webcam support with WebRTC.

Working example @ https://bitwiseworkshop.nl/

### Requirements:
* You will need a SSL certificate for the webcams to work. Use (https://greenlock.domains/) for a free certificate.
* NodeJS (https://nodejs.org/).
* Browserify (`npm install --global browserify`).
#### Optional:
* Watchify (`npm install --global watchify`).

### Getting started:
* Ensure external port 443 is forwarded to your machine.
* Install NodeJS (https://nodejs.org/).
* Clone this repostitory: `git clone https://github.com/scrKevin/sandboardgames.git`.
* `cd sandboardgames` into the created directory.
* Type `npm install`.
* In the root directory of 'sandboardgames' create a folder called 'security' and paste the 'privkey.pem' and 'fullchain.pem' files you received from Greenlock.

### Run the server:
`cd` into the root directory of `sandboardgames` (ie. `cd /home/pi/sandboardgames`).
Run `npm start`.
Invite your friends and enjoy some games.

### Development:
To automatically update the `bundle.js` file (client side javascript):
* `cd sandboardgames` into the root directory.
* `watchify game_modules/client_side/client-side.js -o public/js/bundle.js -v`

Run the test server in a separate terminal:
* `cd` into the root directory of `sandboardgames`.
* Run `npm run dev`.
* Browse to http://localhost:8080 or go to https://your-domain-name
* A test gameroom will be started automatically at http://localhost:8080/0/lobby or https://your-domain-name/0/lobby
