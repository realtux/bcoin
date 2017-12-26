all:
	if [ ! -d "node8" ]; then \
		wget https://nodejs.org/dist/v8.9.3/node-v8.9.3-linux-x64.tar.xz; \
		unxz node-v8.9.3-linux-x64.tar.xz; \
		tar -xf node-v8.9.3-linux-x64.tar; \
		rm node-v8.9.3-linux-x64.tar; \
		mv node-v8.9.3-linux-x64 node8; \
	fi
	cd src; ../node8/bin/npm install
	cd ..
