; Included by the Tauri NSIS template before uninstall removes files.
; ${MAINBINARYNAME} is defined by the bundler (matches the installed .exe stem).

!macro NSIS_HOOK_PREUNINSTALL
  DetailPrint "Terminating ${PRODUCTNAME} (${MAINBINARYNAME}.exe) before uninstall..."
  ; /T terminates the process tree so child processes are stopped too.
  ExecWait 'cmd.exe /c taskkill /F /IM "${MAINBINARYNAME}.exe" /T' $0

  ; Remove SqlLocalDB only when the app recorded ownership (json) and wrote the ProductCode helper .cmd.
  DetailPrint "Removing MewAMP-managed Microsoft SqlLocalDB (if present)..."
  IfFileExists "$APPDATA\MewAMP\app\state\sql_localdb_ownership.json" mewamp_sqllocaldb_check_cmd mewamp_sqllocaldb_hook_skip
  mewamp_sqllocaldb_check_cmd:
  IfFileExists "$APPDATA\MewAMP\app\state\sqllocaldb_uninstall.cmd" mewamp_sqllocaldb_run mewamp_sqllocaldb_hook_skip
  mewamp_sqllocaldb_run:
  ExecWait 'cmd.exe /c call "$APPDATA\MewAMP\app\state\sqllocaldb_uninstall.cmd"' $1
  DetailPrint "sqllocaldb_uninstall.cmd exited with $1"
  Delete "$APPDATA\MewAMP\app\state\sqllocaldb_uninstall.cmd"
  Delete "$APPDATA\MewAMP\app\state\sql_localdb_ownership.json"
  mewamp_sqllocaldb_hook_skip:
!macroend
