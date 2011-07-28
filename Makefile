BING_KEY=AsLurrtJotbxkJmnsefUYbatUuBkeBTzTL930TvcOekeG8SaQPY9Z5LDKtiuzAOu
CLOSURE_LIBRARY=closure-library
COMPILER_JAR=compiler.jar
TARGETS=api/api.js api/deps.js we/shaderbank_codes.js weapp/deps.js weapp/index.js

.PHONY: all
all: api we weapp

.PHONY: api
api: api/api.js api/deps.js

api/api.js: \
	$(filter-out $(TARGETS),$(shell find api we -name \*.js)) \
	we/shaderbank_codes.js \
	Makefile $(CLOSURE_LIBRARY) $(COMPILER_JAR)
	$(CLOSURE_LIBRARY)/closure/bin/build/closurebuilder.py \
		--compiler_flags=--compilation_level=ADVANCED_OPTIMIZATIONS \
		--compiler_flags=--define=goog.DEBUG=false \
		--compiler_flags=--define=we.CALC_FPS=false \
		--compiler_flags=--externs=externs/google_maps_api_v3_5.js \
		--compiler_flags=--warning_level=VERBOSE \
		--compiler_flags=--summary_detail_level=3 \
		--compiler_jar=$(COMPILER_JAR) \
		--root=$(CLOSURE_LIBRARY)/closure/goog/ \
		--root=$(CLOSURE_LIBRARY)/third_party/closure/ \
		--root=api/ \
		--root=we/ \
		--namespace=weapi.exports \
		--output_file=$@ \
		--output_mode=compiled

api/deps.js: \
	$(filter-out $(TARGETS),$(shell find api we -name \*.js)) \
	we/shaderbank_codes.js \
	Makefile $(CLOSURE_LIBRARY) $(COMPILER_JAR)
	$(CLOSURE_LIBRARY)/closure/bin/build/depswriter.py \
		--root_with_prefix="we/ ../../../we" \
		--root_with_prefix="api/ ../../../api" \
		--output_file=$@

.PHONY: we
we: we/shaderbank_codes.js

we/shaderbank_codes.js: \
	$(shell find we/shaders -name \*.glsl) we/build_shaderbank.py
	( cd we && python ./build_shaderbank.py )

.PHONY: weapp
weapp: weapp/deps.js weapp/index.js

weapp/deps.js: \
	$(filter-out $(TARGETS),$(shell find we weapp -name \*.js)) \
	Makefile $(CLOSURE_LIBRARY) $(COMPILER_JAR)
	$(CLOSURE_LIBRARY)/closure/bin/build/depswriter.py \
		--root_with_prefix="we/ ../../../we" \
		--root_with_prefix="weapp/ ../../../weapp" \
		--output_file=$@

weapp/index.js: \
	$(filter-out $(TARGETS),$(shell find we weapp -name \*.js)) \
	Makefile $(CLOSURE_LIBRARY) $(COMPILER_JAR)
	$(CLOSURE_LIBRARY)/closure/bin/build/closurebuilder.py \
		--compiler_flags=--compilation_level=ADVANCED_OPTIMIZATIONS \
		--compiler_flags=--define=goog.DEBUG=false \
		--compiler_flags=--define=we.CALC_FPS=true \
		--compiler_flags=--define=weapp.BING_KEY=\"$(BING_KEY)\" \
		--compiler_flags=--warning_level=VERBOSE \
		--compiler_flags=--externs=externs/google_maps_api_v3_5.js \
		--compiler_flags=--summary_detail_level=3 \
		--compiler_jar=$(COMPILER_JAR) \
		--root=$(CLOSURE_LIBRARY)/closure/goog/ \
		--root=$(CLOSURE_LIBRARY)/third_party/closure/ \
		--root=we/ \
		--root=weapp/ \
		--namespace=weapp \
		--output_file=$@ \
		--output_mode=compiled

.PHONY: clean
clean:
	rm $(TARGETS)

.PHONY: lint
lint:
	gjslint \
		$(foreach target,$(TARGETS),--exclude_files=$(target)) \
		--strict \
		$(filter-out $(TARGETS), $(shell find api we weapp -name \*.js))

closure-library:
	svn checkout http://closure-library.googlecode.com/svn/trunk/ closure-library

compiler.jar:
	curl http://closure-compiler.googlecode.com/files/compiler-latest.tar.gz | tar -xzf - compiler.jar
