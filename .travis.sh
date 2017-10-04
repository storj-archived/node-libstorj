#!/bin/bash

if [[ $TRAVIS_OS_NAME == 'osx' ]]; then
    brew install curl nettle libmicrohttpd libuv
    git clone https://github.com/Storj/libstorj.git
    cd libstorj
    ./autogen.sh
    ./configure
    sudo make install
else
    echo "deb http://us.archive.ubuntu.com/ubuntu/ xenial main" | sudo tee -a /etc/apt/sources.list
    echo "deb http://us.archive.ubuntu.com/ubuntu/ xenial universe" | sudo tee -a /etc/apt/sources.list
    echo "deb http://us.archive.ubuntu.com/ubuntu/ xenial-updates universe" | sudo tee -a /etc/apt/sources.list
    echo "deb http://us.archive.ubuntu.com/ubuntu/ xenial-updates multiverse" | sudo tee -a /etc/apt/sources.list
    echo "deb http://security.ubuntu.com/ubuntu xenial-security main" | sudo tee -a /etc/apt/sources.list
    echo "deb http://security.ubuntu.com/ubuntu xenial-security multiverse" | sudo tee -a /etc/apt/sources.list
    sudo apt-get update -qq
    sudo apt-get install build-essential libtool autotools-dev automake libmicrohttpd-dev
    sudo apt-get install libcurl4-gnutls-dev nettle-dev libjson-c-dev libuv1-dev
    git clone https://github.com/Storj/libstorj.git
    cd libstorj
    ./autogen.sh
    ./configure --prefix=/usr
    sudo make install
fi
