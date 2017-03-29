SRC = $(shell find src -type f -name '*.js')
LIB = $(SRC:src/%.js=lib/%.js) $(SRC:src/%.js=lib/%.js.flow)
BIN = ./node_modules/.bin

test:
	@$(BIN)/jest --runInBand

test-watch:
	@$(BIN)/jest --runInBand --watch

check:
	@$(BIN)/flow

build: $(LIB)

lib/%.js: src/%.js
	@mkdir -p $(@D)
	@$(BIN)/babel -o $@ $<

lib/%.js.flow: src/%.js
	@mkdir -p $(@D)
	@cp $< $@
