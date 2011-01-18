@ECHO off

REM   This simple batch file can be used to run all *.js
REM   files from WebGL Earth through Closure Linter.

set PROJECT_ROOT=C:/Users/Petr/Documents/WebGL-Earth/trunk
set CLOSURE_LINTER=C:/Program Files (x86)/Python27/Scripts

REM @ECHO on

"%CLOSURE_LINTER%\fixjsstyle.exe" --strict "%PROJECT_ROOT%\webgl-externs.js"
"%CLOSURE_LINTER%\gjslint.exe" --strict "%PROJECT_ROOT%\webgl-externs.js"

"%CLOSURE_LINTER%\fixjsstyle.exe" --strict -r "%PROJECT_ROOT%\we" -x "%PROJECT_ROOT%\we\shaderbank_codes.js"
"%CLOSURE_LINTER%\gjslint.exe" --strict -r "%PROJECT_ROOT%\we" -x "%PROJECT_ROOT%\we\shaderbank_codes.js"


"%CLOSURE_LINTER%\fixjsstyle.exe" --strict -r "%PROJECT_ROOT%\wedemo"
"%CLOSURE_LINTER%\gjslint.exe" --strict -r "%PROJECT_ROOT%\wedemo"

@ECHO off

PAUSE