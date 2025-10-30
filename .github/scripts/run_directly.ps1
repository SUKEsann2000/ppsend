$waitTime = 30000
$workingDir = $PWD.Path

$stdoutLog = "$workingDir\stdout.log"
$stderrLog = "$workingDir\stderr.log"

Remove-Item $stdoutLog, $stderrLog -ErrorAction SilentlyContinue

$startInfo = New-Object System.Diagnostics.ProcessStartInfo
$startInfo.FileName = "npm.cmd"
$startInfo.Arguments = "run start -- --ppSendDebug"
$startInfo.WorkingDirectory = $workingDir
$startInfo.RedirectStandardOutput = $true
$startInfo.RedirectStandardError  = $true
$startInfo.UseShellExecute = $false
$startInfo.CreateNoWindow = $true

$proc = New-Object System.Diagnostics.Process
$proc.StartInfo = $startInfo

$stdOutWriter = [System.IO.StreamWriter]::new($stdoutLog, $true)
$stdErrWriter = [System.IO.StreamWriter]::new($stderrLog, $true)

# イベントは Start 前に登録する
$proc.add_OutputDataReceived({
    param($sender, $args)
    if ($args.Data) { $stdOutWriter.WriteLine($args.Data) }
})

$proc.add_ErrorDataReceived({
    param($sender, $args)
    if ($args.Data) { $stdErrWriter.WriteLine($args.Data) }
})

$proc.Start() | Out-Null
$proc.BeginOutputReadLine()
$proc.BeginErrorReadLine()

if (-not $proc.WaitForExit($waitTime)) {
    Write-Host "Timeout reached ($($waitTime/1000)s), killing process..."
    $proc.Kill()
    $proc.WaitForExit()
}

# 少し待って出力flush
Start-Sleep -Milliseconds 200
$stdOutWriter.Close()
$stdErrWriter.Close()

Write-Host "Process finished. Exit code: $($proc.ExitCode)"

Get-Content $stdoutLog
Get-Content $stderrLog

if ($proc.ExitCode -ne 0) {
    Write-Host "Process exited with error"
    exit 1
}