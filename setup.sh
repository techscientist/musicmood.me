sudo apt-get update -y
sudo apt-get upgrade -y
curl -sL https://deb.nodesource.com/setup_5.x | sudo -E bash -
sudo apt-get install -y build-essential libssl-dev python-pip python-dev libfreetype6 libfreetype6-dev pkg-config python-numpy python-scipy python-matplotlib ipython ipython-notebook python-pandas python-sympy python-nose libsamplerate0 libsamplerate0-dev libav-tools git mongodb nodejs
cd node
npm install
