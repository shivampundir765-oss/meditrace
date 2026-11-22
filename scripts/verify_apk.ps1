Add-Type -AssemblyName System.IO.Compression.FileSystem

$aaptExe = (Get-ChildItem -Path "$env:LOCALAPPDATA\Android\Sdk\build-tools\*\aapt.exe" -ErrorAction SilentlyContinue | Select-Object -First 1).FullName
if ($aaptExe) {
    Write-Output "--- AAPT Badging ---"
    & $aaptExe dump badging "meditrace-universal-release.apk" | Select-String -Pattern "package:|application-label:|launchable-activity:|icon="
} else {
    Write-Output "aapt executable not found"
}
