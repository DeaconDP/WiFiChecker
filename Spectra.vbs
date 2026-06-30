Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
appDir = fso.GetParentFolderName(WScript.ScriptFullName)
shell.CurrentDirectory = appDir

pythonw = "pythonw"
If shell.Run("cmd /c where pythonw >nul 2>&1", 0, True) <> 0 Then
  pythonw = "python"
End If

shell.Run """" & pythonw & """ """ & appDir & "\launch.py""", 0, False
