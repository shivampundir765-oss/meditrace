Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead('meditrace-universal-release.apk')

Write-Output "--- Camera Native Libraries in APK ---"
$zip.Entries | Where-Object { $_.FullName -like "*camera*" -or $_.FullName -like "*imagepicker*" } | Select-Object -First 10 | ForEach-Object { Write-Output $_.FullName }

Write-Output "--- JS Bundle Size ---"
$zip.Entries | Where-Object { $_.FullName -like "*index.android.bundle*" } | ForEach-Object { Write-Output "$($_.FullName) ($($_.Length) bytes)" }

Write-Output "--- ABIs Supported ---"
$zip.Entries | Where-Object { $_.FullName -like "lib/*/libhermes.so" } | ForEach-Object { Write-Output "$($_.FullName)" }

$zip.Dispose()
