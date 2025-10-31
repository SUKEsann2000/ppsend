$proc = Start-Process -FilePath "node" -ArgumentList "index.js --ppSendDebug" -PassThru `
                    -RedirectStandardOutput "stdout.log" `
                    -RedirectStandardError "stderr.log" `
                    -WorkingDirectory "$PWD"

$waitTime = 30000
$proc.WaitForExit($waitTime)

if (-not $proc.HasExited) {
    Write-Host "Timeout reached (30s), process still running. Killing..."
    $proc.Kill()
    Write-Host "Timeout finished — considered normal exit"
    exit 0
}

Write-Host "Process finished. Exit code: $($proc.ExitCode)"
Get-Content stdout.log
Get-Content stderr.log

if ($proc.ExitCode -ne 0) {
    Write-Host "Process exited with error"
    exit 1
}