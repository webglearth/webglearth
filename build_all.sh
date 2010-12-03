#!/bin/bash

echo This simple batch file can be used to run Closure Compiler on
echo WebGL Earth source files to produce single, optimized .js file.

PROJECT_ROOT=`pwd`
LIB_ROOT=$PROJECT_ROOT/closure-library/closure
LEVEL=ADVANCED_OPTIMIZATIONS
WEBGL_EXTERNS=--externs=webgl-externs.js
DEFINE_FLAGS1=--define=goog.DEBUG=false
DEFINE_FLAGS2=--define=we.CALC_FPS=true
# WARNING_FLAGS=--compiler_flags="--warning_level=VERBOSE" --compiler_flags="--jscomp_warning=deprecated" --compiler_flags="--jscomp_warning=visibility" --compiler_flags="--jscomp_warning=accessControls" --compiler_flags="--jscomp_warning=strictModuleDepCheck" --compiler_flags="--jscomp_warning=missingProperties"

# --define=goog.DEBUG=true 

$LIB_ROOT/bin/build/depswriter.py --root_with_prefix="$PROJECT_ROOT/we/ ../../../we" --output_file="$PROJECT_ROOT/we/deps.js_"

$LIB_ROOT/bin/build/closurebuilder.py --root="$LIB_ROOT/goog/" --root="$PROJECT_ROOT/we/" --root="$PROJECT_ROOT/closure-library/third_party/closure/" --namespace="we" --output_mode=compiled --compiler_jar="$PROJECT_ROOT/compiler.jar" --compiler_flags="--compilation_level=$LEVEL" --compiler_flags="$DEFINE_FLAGS1" --compiler_flags="$DEFINE_FLAGS2" $WARNING_FLAGS --compiler_flags="$WEBGL_EXTERNS" --output_file="$PROJECT_ROOT/compiled.js"


# --compiler_flags="--formatting=PRETTY_PRINT"
