# Sandboardgames
Sandbox style board game engine written in NodeJS.

Working example @ https://bitwiseworkshop.nl/

### Requirements:
* You will need a SSL certificate to get the webcams to work. Use (https://greenlock.domains/) for a free certificate.
* NodeJS (https://nodejs.org/)
* Browserify (`npm install --global browserify`)
#### Optional:
* Watchify (`npm install --global watchify`)

### Getting started:
* Ensure external port 443 is forwarded to your machine.
* Install NodeJS (https://nodejs.org/)
* Clone this repostitory.
* Go to the created directory in your favorite terminal and type `npm install`
* In the root directory of 'sandboardgames' create a folder called 'security' and paste the 'privkey.pem' and 'fullchain.pem' files you received from Greenlock.


To automatically update the `bundle.js` file:
* `cd` into the /public/js folder.
* `watchify shared-game-logic.js -o bundle.js -v`

In a separate terminal:
run `npm run dev`
browse to http://localhost:8080 or go to https://your-domain-name
