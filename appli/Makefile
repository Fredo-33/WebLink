MAKEFLAGS += --no-print-directory
SHELL := /bin/bash
PATH := node_modules/.bin:$(PATH)
NODE_OPTS = NEXT_TELEMETRY_DISABLED=1 BROWSERSLIST_IGNORE_OLD_DATA=1 NODE_OPTIONS="--openssl-legacy-provider --max-old-space-size=400"
BUILD_FILTER = 2>&1 | grep -vE '^(Browserslist:|npx browserslist|warn  -|Warning: You have opted-out|Read more: https://err\.sh)'
HOTSPOT ?= root@192.168.1.66

all: setup

.PHONY: setup test clean build dev sync push deploy stop start restart rebuild nodeinfo deps systeme place

DEPS_SUM = $$(cat package.json package-lock.json 2>/dev/null | cksum | cut -d' ' -f1)

deps:
	@sum=$(DEPS_SUM); \
	if [ ! -d node_modules ] || { [ -f node_modules/.weblink-deps ] && [ "$$(cat node_modules/.weblink-deps)" != "$$sum" ]; }; then \
		$(NODE_OPTS) npm install --legacy-peer-deps && echo "$$sum" > node_modules/.weblink-deps; \
	else \
		echo "$$sum" > node_modules/.weblink-deps; echo "Dépendances à jour"; \
	fi

nodeinfo:
	node tools/nodeinfo-json.js

systeme:
	@bash tools/installsysteme.sh

place:
	@if [ -f systeme.tgz ] || [ -f .next.tgz ]; then \
		ifree=$$(df -Pi . | awk 'NR==2 {print $$4}'); libre=$$(df -Pm . | awk 'NR==2 {print $$4}'); \
		if [ "$$ifree" -lt 4096 ] || [ "$$libre" -lt 96 ]; then \
			echo "Place ou inodes insuffisants ($$libre Mo, $$ifree inodes libres), extension de la carte .."; \
			if [ -f systeme.tgz ] && tar -xzf systeme.tgz -O --wildcards '*usr/local/sbin/weblink-etendre' > /tmp/weblink-etendre 2>/dev/null; then bash /tmp/weblink-etendre || true; fi; \
			rm -f /tmp/weblink-etendre; \
		fi; \
	fi
	@if [ -f .next.tgz ]; then \
		ifree=$$(df -Pi . | awk 'NR==2 {print $$4}'); \
		if [ "$$ifree" -lt 512 ]; then rm -rf .next.old; fi; \
		rm -rf .next && mkdir .next && tar -xzf .next.tgz -C .next && rm -f .next.tgz; \
	fi
	@if [ -f systeme.tgz ]; then \
		rm -rf systeme && mkdir systeme && tar -xzf systeme.tgz -C systeme && rm -f systeme.tgz; \
	fi

setup: place deps nodeinfo systeme
	@set -o pipefail; if [ -f .next/PREBUILT ] && [ "$$(cat .next/PREBUILT)" = "$$(sed -n 3p version.txt | tr -d '[:space:]')" ]; then echo "Version précompilée, pas de compilation"; else $(NODE_OPTS) next build $(BUILD_FILTER); fi

build: nodeinfo
	set -o pipefail; $(NODE_OPTS) next build $(BUILD_FILTER)
	
dev:
	$(NODE_OPTS) node server.js

stop:
	systemctl stop weblink-web

start:
	systemctl start weblink-web

restart:
	systemctl restart weblink-web

rebuild:
	make build

clean:
	rm -rf node_modules/
	rm -rf .next/
	rm -f package-lock.json

deploy: build
	rsync -av --exclude node_modules --exclude .next --exclude .git --exclude .gitignore --exclude .DS_Store ./ $(HOTSPOT):/opt/weblink/
	rsync -a --delete --exclude cache .next/ $(HOTSPOT):/opt/weblink/.next/
	ssh $(HOTSPOT) systemctl restart weblink-web