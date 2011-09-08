@ECHO off

REM   This simple batch file can be used to run all *.js
REM   files from WebGL Earth through Closure Linter.

set PROJECT_ROOT=%CD%

REM  Change the following line to point to the directory where you have installed fixjsstyle.exe and gjslint.exe.
set CLOSURE_LINTER=C:/Program Files/Python27/Scripts

REM @ECHO on

"%CLOSURE_LINTER%\fixjsstyle.exe" --strict -r "%PROJECT_ROOT%\we" -x "%PROJECT_ROOT%\we\shaderbank_codes.js"
"%CLOSURE_LINTER%\gjslint.exe" --strict -r "%PROJECT_ROOT%\we" -x "%PROJECT_ROOT%\we\shaderbank_codes.js"

"%CLOSURE_LINTER%\fixjsstyle.exe" --strict -r "%PROJECT_ROOT%\weapp" -x "%PROJECT_ROOT%\weapp\deps.js,%PROJECT_ROOT%\weapp\index.js"
"%CLOSURE_LINTER%\gjslint.exe" --strict -r "%PROJECT_ROOT%\weapp" -x "%PROJECT_ROOT%\weapp\deps.js,%PROJECT_ROOT%\weapp\index.js"

"%CLOSURE_LINTER%\fixjsstyle.exe" --strict -r "%PROJECT_ROOT%\api" -x "%PROJECT_ROOT%\api\deps.js,%PROJECT_ROOT%\api\api.js"
"%CLOSURE_LINTER%\gjslint.exe" --strict -r "%PROJECT_ROOT%\api" -x "%PROJECT_ROOT%\api\deps.js,%PROJECT_ROOT%\api\api.js"

@ECHO off

PAUSE