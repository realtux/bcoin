# Copyright (c) 2017 Brian Seymour
# Distributed under the MIT software license, see the accompanying
# file "license" or http://www.opensource.org/licenses/mit-license.php.

UNAME := $(shell uname -s)

ifeq ($(UNAME),Linux)
	FILENAME = node-v8.9.3-linux-x64
	DOWNLOAD_CMD = wget https://nodejs.org/dist/v8.9.3/$(FILENAME).tar.xz
endif

ifeq ($(UNAME),Darwin)
	FILENAME = node-v8.9.3-darwin-x64
	DOWNLOAD_CMD = curl https://nodejs.org/dist/v8.9.3/$(FILENAME).tar.xz -o $(FILENAME).tar.xz
endif

all:
	mkdir -p tmp
	if [ ! -d "node8" ]; then \
		$(DOWNLOAD_CMD); \
		unxz $(FILENAME).tar.xz; \
		tar -xf $(FILENAME).tar; \
		rm $(FILENAME).tar; \
		mv $(FILENAME) node8; \
	fi
	cd src; ../node8/bin/npm install
	cd ..
