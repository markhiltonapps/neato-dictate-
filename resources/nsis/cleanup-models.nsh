!macro customUnInstall
  ${ifNot} ${isUpdated}
    StrCpy $0 "$PROFILE\.cache\neato-dictate\models"
    IfFileExists "$0\*.*" 0 +3
      RMDir /r "$0"
      DetailPrint "Removed Neato Dictate cached models"
    StrCpy $1 "$PROFILE\.cache\neato-dictate"
    RMDir "$1"
  ${endIf}
!macroend
