UNAME := $(shell uname -s)

ifeq ($(UNAME),Linux)
	FILENAME = node-v8.9.3-linux-x64
endif

ifeq ($(UNAME),Darwin)
	FILENAME = node-v8.9.3-darwin-x64
endif

all:
	if [ ! -d "node8" ]; then \
		wget https://nodejs.org/dist/v8.9.3/$(FILENAME).tar.xz; \
		unxz $(FILENAME).tar.xz; \
		tar -xf $(FILENAME).tar; \
		rm $(FILENAME).tar; \
		mv $(FILENAME) node8; \
	fi
	cd src; ../node8/bin/npm install
	cd ..
