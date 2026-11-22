$files = Get-ChildItem -Recurse -File "mobile" -Exclude "node_modules" | Where-Object { $_.FullName -notmatch "node_modules|\.gradle|build" }

foreach ($f in $files) {
    if ($f.Attributes -match "ReparsePoint") {
        Write-Output "Fixing reparse point: $($f.FullName)"
        $content = [System.IO.File]::ReadAllBytes($f.FullName)
        $tmp = "$($f.FullName).tmp"
        [System.IO.File]::WriteAllBytes($tmp, $content)
        Remove-Item $f.FullName -Force
        Move-Item $tmp $f.FullName -Force
    }
}
Write-Output "Reparse check complete."
