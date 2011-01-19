@ECHO off

REM   This simple batch file can be used to run all *.js
REM   files from WebGL Earth through Closure Linter.

set PROJECT_ROOT=C:/Users/Petr/Documents/WebGL-Earth/trunk
set CLOSURE_LINTER=C:/Program Files (x86)/Python27/Scripts

REM @ECHO on

"%CLOSURE_LINTER%\fixjsstyle.exe" --strict -r "%PROJECT_ROOT%\we" -x "%PROJECT_ROOT%\we\shaderbank_codes.js"
"%CLOSURE_LINTER%\gjslint.exe" --strict -r "%PROJECT_ROOT%\we" -x "%PROJECT_ROOT%\we\shaderbank_codes.js"

"%CLOSURE_LINTER%\fixjsstyle.exe" --strict -r "%PROJECT_ROOT%\weapp" -x "%PROJECT_ROOT%\weapp\deps.js,%PROJECT_ROOT%\weapp\index.js"
"%CLOSURE_LINTER%\gjslint.exe" --strict -r "%PROJECT_ROOT%\weapp" -x "%PROJECT_ROOT%\weapp\deps.js,%PROJECT_ROOT%\weapp\index.js"

@ECHO off

PAUSE