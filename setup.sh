sudo apt-get update -y
sudo apt-get upgrade -y
sudo apt-get install -y build-essential libssl-dev python-pip python-dev libfreetype6 libfreetype6-dev pkg-config python-numpy python-scipy python-matplotlib ipython ipython-notebook python-pandas python-sympy python-nose libsamplerate0 libsamplerate0-dev libav-tools git mongodb
curl https://raw.githubusercontent.com/creationix/nvm/v0.7.0/install.sh | sh
source ~/.profile
nvm install 5.5.0
cd node
npm install
