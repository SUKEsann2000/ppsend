$waitTime = 30000
$workingDir = $PWD.Path

$stdoutLog = "$workingDir\stdout.log"
$stderrLog = "$workingDir\stderr.log"

Remove-Item $stdoutLog, $stderrLog -ErrorAction SilentlyContinue

$startInfo = New-Object System.Diagnostics.ProcessStartInfo
$startInfo.FileName = "node"
$startInfo.Arguments = "index.js --ppSendDebug"
$startInfo.WorkingDirectory = $workingDir
$startInfo.RedirectStandardOutput = $true
$startInfo.RedirectStandardError  = $true
$startInfo.UseShellExecute = $false
$startInfo.CreateNoWindow = $true

$proc = [System.Diagnostics.Process]::Start($startInfo)

$stdout = $proc.StandardOutput.ReadToEnd()
$stderr = $proc.StandardError.ReadToEnd()

if (-not $proc.WaitForExit($waitTime)) {
    Write-Host "Timeout reached ($($waitTime/1000)s), killing process..."
    $proc.Kill()
    $proc.WaitForExit()
}

$stdout | Out-File -FilePath $stdoutLog -Encoding utf8
$stderr | Out-File -FilePath $stderrLog -Encoding utf8

Write-Host "Process finished. Exit code: $($proc.ExitCode)"

Get-Content $stdoutLog
Get-Content $stderrLog

if ($proc.ExitCode -ne 0) {
    Write-Host "Process exited with error"
    exit 1
}