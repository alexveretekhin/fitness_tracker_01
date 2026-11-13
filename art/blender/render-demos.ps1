# Рендер демо упражнений из сцены Blender в MP4 + WebM для приложения.
# Примеры (из папки репозитория):
#   .\art\blender\render-demos.ps1 -Blend D:\fitness_tracker_01\demos.blend -List
#   .\art\blender\render-demos.ps1 -Blend D:\fitness_tracker_01\demos.blend -Only push-ups -Preview
#   .\art\blender\render-demos.ps1 -Blend D:\fitness_tracker_01\demos.blend
param(
    [Parameter(Mandatory = $true)][string]$Blend,
    [string]$Only = "",
    [switch]$List,
    [switch]$Preview,
    [switch]$KeepLast,
    [string]$Rig = "",
    [string]$Blender = ""
)
$ErrorActionPreference = "Stop"

if (-not (Test-Path $Blend)) { throw "Нет файла сцены: $Blend" }

# Ищем blender.exe: параметр -Blender, затем PATH, затем стандартная папка установки
if (-not $Blender) {
    $cmd = Get-Command blender -ErrorAction SilentlyContinue
    if ($cmd) { $Blender = $cmd.Source }
}
if (-not $Blender) {
    $Blender = Get-ChildItem "C:\Program Files\Blender Foundation\*\blender.exe" -ErrorAction SilentlyContinue |
        Sort-Object { try { [version]($_.Directory.Name -replace '[^0-9.]', '') } catch { [version]'0.0' } } -Descending |
        Select-Object -First 1 -ExpandProperty FullName
}
if (-not $Blender) { throw "Не нашёл blender.exe. Укажи путь: -Blender 'C:\...\blender.exe'" }

$script = Join-Path $PSScriptRoot "render_demos.py"
$argv = @("--background", $Blend, "--python-exit-code", "1", "--python", $script, "--")
if ($List) { $argv += "--list" }
if ($Only) { $argv += @("--only", $Only) }
if ($Preview) { $argv += "--preview" }
if ($KeepLast) { $argv += "--keep-last" }
if ($Rig) { $argv += @("--rig", $Rig) }

Write-Host "Blender: $Blender"
& $Blender @argv
exit $LASTEXITCODE
