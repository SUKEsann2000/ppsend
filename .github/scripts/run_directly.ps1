$waitTime = 30000

$workingDir = $PWD.Path

$stdoutLog = "$workingDir\stdout.log"
$stderrLog = "$workingDir\stderr.log"

Remove-Item $stdoutLog,$stderrLog -ErrorAction SilentlyContinue

# Start npm process
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
$proc.Start() | Out-Null

$stdOutWriter = [System.IO.StreamWriter]::new($stdoutLog, $true)
$stdErrWriter = [System.IO.StreamWriter]::new($stderrLog, $true)

$proc.BeginOutputReadLine()
$proc.BeginErrorReadLine()

$proc.OutputDataReceived += { param($sender,$args) if ($args.Data) { $stdOutWriter.WriteLine($args.Data) } }
$proc.ErrorDataReceived  += { param($sender,$args) if ($args.Data) { $stdErrWriter.WriteLine($args.Data) } }

if (-not $proc.WaitForExit($waitTime)) {
    Write-Host "Timeout reached ($($waitTime/1000)s), killing process..."
    $proc.Kill()
}

$stdOutWriter.Close()
$stdErrWriter.Close()

# Exit code
Write-Host "Process finished. Exit code: $($proc.ExitCode)"

Get-Content $stdoutLog
Get-Content $stderrLog

if ($proc.ExitCode -ne 0) {
    Write-Host "Process exited with error"
    exit 1
}
