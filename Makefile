
SRCS = $(wildcard *.js)
DIST = dist
DISTS = $(patsubst %,$(DIST)/%,$(SRCS))

.PHONY: all lint dist-lint twitch-api

all: lint dist dist-lint twitch-api

twitch-api:
	cd twitch-api && git pull

lint:
	npx eslint --env browser --env es6 *.js

dist: $(DISTS)

dist/%.js: %.js
	test -d dist || mkdir dist
	npx babel --presets babel-preset-es2015 $< -d dist/

dist-lint: dist
	npx eslint --env browser $(DISTS)
