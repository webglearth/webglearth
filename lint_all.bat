@ECHO off

REM   This simple batch file can be used to run all *.js
REM   files from WebGL Earth through Closure Linter.

set PROJECT_ROOT=C:/Users/Petr/Documents/WebGL-Earth/trunk
set CLOSURE_LINTER=C:/Program Files (x86)/Python27/Scripts

REM @ECHO on

REM "%CLOSURE_LINTER%/gjslint.exe" "%PROJECT_ROOT%\we\*.js"
"%CLOSURE_LINTER%\fixjsstyle.exe" --strict "%PROJECT_ROOT%\webgl-externs.js"
"%CLOSURE_LINTER%\fixjsstyle.exe" --strict "%PROJECT_ROOT%\we\*.js"
"%CLOSURE_LINTER%\fixjsstyle.exe" --strict "%PROJECT_ROOT%\we\*\*.js"
"%CLOSURE_LINTER%\fixjsstyle.exe" --strict "%PROJECT_ROOT%\we\*\*\*.js"
"%CLOSURE_LINTER%\gjslint.exe" --strict "%PROJECT_ROOT%\webgl-externs.js"
"%CLOSURE_LINTER%\gjslint.exe" --strict "%PROJECT_ROOT%\we\*.js"
"%CLOSURE_LINTER%\gjslint.exe" --strict "%PROJECT_ROOT%\we\*\*.js"
"%CLOSURE_LINTER%\gjslint.exe" --strict "%PROJECT_ROOT%\we\*\*\*.js"


"%CLOSURE_LINTER%\fixjsstyle.exe" --strict "%PROJECT_ROOT%\wedemo\*.js"
"%CLOSURE_LINTER%\fixjsstyle.exe" --strict "%PROJECT_ROOT%\wedemo\*\*.js"
"%CLOSURE_LINTER%\gjslint.exe" --strict "%PROJECT_ROOT%\wedemo\*.js"
"%CLOSURE_LINTER%\gjslint.exe" --strict "%PROJECT_ROOT%\wedemo\*\*.js"

@ECHO off

PAUSE