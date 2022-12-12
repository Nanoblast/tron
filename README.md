# TRON - The recreation of the classic game of the 90's.

The software was developed in cooperation with András Gerendás, Copyright to András Gerendás and Olivér Nagy.

## Introduction 

The game is on open source recreation of the 90's classic tactical game. However, this version is round-based instead of being real-time. In the game 2-4 players and compete against each other. Their goal is to make other collide with walls or their laser left behind by their vehicle.

## Installation gude
The server is based on Flask, written in Python. To run the server you must have Python 3.6 environment.

* First install the dependencies with pip package manager. The collection of requirements is colledted the requirements.txt file. To install the dependencies run the following command: ``` pip install -r requirements.txt ```
* Once the dependencies are installed run the server with the following command: ``` python apy.py --port port ```. The server should serve on localhost:port. By default it starts on localhost:5000. If you change that be sure to track it down in ``` client/js/data.js ```

## Running the game

After starting the server open the ``` index.html ``` in any browser. The browser must support ES6+. Follow the instructions shown in the menu.



 ## Review of the gameplay
 
 ![alt text](https://github.com/Nanoblast/tron/blob/main/documentation/labiritron.JPG?raw=true)
