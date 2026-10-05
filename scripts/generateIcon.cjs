const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const psScript = `
Add-Type -AssemblyName System.Drawing
$pngPath = (Resolve-Path 'electron/icon.png').Path
$icoPath = [System.IO.Path]::Combine((Split-Path $pngPath), 'icon.ico')
$bmp = [System.Drawing.Bitmap]::FromFile($pngPath)
$sizes = @(16, 32, 48, 64, 128, 256)

# Create high-quality icon using System.Drawing
$thumb = New-Object System.Drawing.Bitmap $bmp, 256, 256
$hIcon = $thumb.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hIcon)
$fs = New-Object System.IO.FileStream $icoPath, ([System.IO.FileMode]::Create)
$icon.Save($fs)
$fs.Close()
$bmp.Dispose()
$thumb.Dispose()
Write-Host "Created $icoPath successfully"
`;

const tempPs = path.join(__dirname, 'temp_ico.ps1');
fs.writeFileSync(tempPs, psScript, 'utf-8');
try {
  execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${tempPs}"`, { stdio: 'inherit' });
  const publicIco = path.resolve('public/icon.ico');
  const electronIco = path.resolve('electron/icon.ico');
  fs.copyFileSync(electronIco, publicIco);
  console.log('Copied icon.ico to public and electron folders.');
} finally {
  if (fs.existsSync(tempPs)) fs.unlinkSync(tempPs);
}
