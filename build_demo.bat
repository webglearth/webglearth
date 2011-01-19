@ECHO off

REM   This simple batch file can be used to run Closure Compiler on
REM   WebGL Earth source files to produce single, optimized .js file.

set PROJECT_ROOT=C:/Users/Petr/Documents/WebGL-Earth/trunk
set LIB_ROOT=%PROJECT_ROOT%/closure-library/closure
set LEVEL=ADVANCED_OPTIMIZATIONS
set WEBGL_EXTERNS=--externs=we/webgl-externs.js
set DEFINE_FLAGS1=--define=goog.DEBUG=false
set DEFINE_FLAGS2=--define=we.CALC_FPS=true
set DEFINE_FLAGS3=--define=weapp.BING_KEY="\"AsLurrtJotbxkJmnsefUYbatUuBkeBTzTL930TvcOekeG8SaQPY9Z5LDKtiuzAOu\""
set WARNING_FLAGS=--compiler_flags="--warning_level=VERBOSE" --compiler_flags="--jscomp_warning=deprecated" --compiler_flags="--jscomp_warning=visibility" --compiler_flags="--jscomp_warning=accessControls" --compiler_flags="--jscomp_warning=strictModuleDepCheck" --compiler_flags="--jscomp_warning=missingProperties" 

REM --define=goog.DEBUG=true 

@ECHO on

%LIB_ROOT%/bin/build/depswriter.py --root_with_prefix="%PROJECT_ROOT%/we/ ../../../we" --root_with_prefix="%PROJECT_ROOT%/weapp/ ../../../weapp" --output_file="%PROJECT_ROOT%/weapp/deps.js"

%LIB_ROOT%/bin/build/closurebuilder.py --root="%LIB_ROOT%/goog/" --root="%PROJECT_ROOT%/we/" --root="%PROJECT_ROOT%/weapp/" --root="%PROJECT_ROOT%/closure-library/third_party/closure/" --namespace="weapp" --output_mode=compiled --compiler_jar="%PROJECT_ROOT%/compiler.jar" --compiler_flags="--compilation_level=%LEVEL%" --compiler_flags="%DEFINE_FLAGS1%" --compiler_flags="%DEFINE_FLAGS2%" --compiler_flags="%DEFINE_FLAGS3%" %WARNING_FLAGS% --compiler_flags="%WEBGL_EXTERNS%" --output_file="%PROJECT_ROOT%/weapp/index.js"

@ECHO off

REM --compiler_flags="--formatting=PRETTY_PRINT"

PAUSE