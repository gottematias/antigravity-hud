# Windows PowerShell Installer for Antigravity HUD
param(
  [switch]$Uninstall
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$installJs = Join-Path $scriptDir "install.js"

if ($Uninstall) {
  node $installJs --uninstall
} else {
  node $installJs
}
