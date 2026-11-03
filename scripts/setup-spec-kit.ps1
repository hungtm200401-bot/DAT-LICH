<#
.SYNOPSIS
Install shared Spec Kit tools once, or initialize an existing Windows project.
.EXAMPLE
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/setup-spec-kit.ps1 -ToolsOnly -InstallSharedCommand
.EXAMPLE
speckit-project "D:\Projects\another-project"
#>
[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [string]$ProjectPath = (Get-Location).Path,
    [switch]$ToolsOnly,
    [switch]$InstallSharedCommand
)

$ErrorActionPreference = 'Stop'
$specKitVersion = '1.2.6'
$uvVersion = '0.13.6'
$uvInstallerHash = 'D00580051699BEE58A2E2D9B925F45788B35F7E0FFF7966FD5BEDFC3C547DC7D'
$sharedBin = Join-Path $env:USERPROFILE '.local\bin'
$utf8 = New-Object System.Text.UTF8Encoding($false)

function Resolve-Tool([string]$Name) {
    $sharedPath = Join-Path $sharedBin "$Name.exe"
    if (Test-Path -LiteralPath $sharedPath -PathType Leaf) { return $sharedPath }
    $command = Get-Command "$Name.exe" -ErrorAction SilentlyContinue
    if ($command) { return $command.Source }
    return $null
}

function Install-Tools {
    $uv = Resolve-Tool 'uv'
    if (-not $uv) {
        $installer = Join-Path ([System.IO.Path]::GetTempPath()) ("install-uv-" + [guid]::NewGuid() + '.ps1')
        try {
            Invoke-WebRequest -UseBasicParsing -Uri "https://astral.sh/uv/$uvVersion/install.ps1" -OutFile $installer
            if ((Get-FileHash -LiteralPath $installer -Algorithm SHA256).Hash -ne $uvInstallerHash) {
                throw 'The uv installer checksum differs from the reviewed installer. Installation stopped.'
            }
            & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $installer
            if ($LASTEXITCODE -ne 0) { throw 'uv installation failed.' }
        } finally {
            if (Test-Path -LiteralPath $installer) { Remove-Item -LiteralPath $installer }
        }
        $uv = Resolve-Tool 'uv'
        if (-not $uv) { throw 'uv was not found after installation.' }
    }

    # uv keeps a single user-level tool environment, shared by all repositories.
    $installed = & $uv tool list 2>&1
    if ($LASTEXITCODE -ne 0) { throw "Cannot inspect installed uv tools: $installed" }
    if (($installed -join "`n") -notmatch "(?m)^specify-cli v$([regex]::Escape($specKitVersion))(?:\s|$)") {
        & $uv tool install --force --python 3.12 specify-cli --from "git+https://github.com/github/spec-kit.git@v$specKitVersion"
        if ($LASTEXITCODE -ne 0) { throw 'Spec Kit installation failed.' }
    }
    $env:PATH = "$sharedBin;$env:PATH"
    $specify = Resolve-Tool 'specify'
    if (-not $specify) { throw 'specify was not found after installation.' }
    & $specify version
    if ($LASTEXITCODE -ne 0) { throw 'Spec Kit runtime verification failed.' }
    return $specify
}

function Install-SharedCommand {
    New-Item -ItemType Directory -Path $sharedBin -Force | Out-Null
    $sharedScript = Join-Path $sharedBin 'speckit-project.ps1'
    if ([System.IO.Path]::GetFullPath($PSCommandPath) -ne $sharedScript) {
        Copy-Item -LiteralPath $PSCommandPath -Destination $sharedScript -Force
    }
    $wrapper = "@echo off`r`npowershell.exe -NoProfile -ExecutionPolicy Bypass -File `"%~dp0speckit-project.ps1`" %*`r`nexit /b %errorlevel%`r`n"
    [System.IO.File]::WriteAllText((Join-Path $sharedBin 'speckit-project.cmd'), $wrapper, $utf8)
    # uv's installer adds this directory to PATH; also handle a pre-existing uv.
    $userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
    if (($userPath -split ';').TrimEnd('\') -notcontains $sharedBin.TrimEnd('\')) {
        [Environment]::SetEnvironmentVariable('Path', "$sharedBin;$userPath", 'User')
    }
    $env:PATH = "$sharedBin;$env:PATH"
    Write-Host 'Shared command installed. Reopen your terminal to use speckit-project from any project.'
}

if ($ToolsOnly) {
    $null = Install-Tools
    if ($InstallSharedCommand) { Install-SharedCommand }
    exit 0
}

if (-not (Test-Path -LiteralPath $ProjectPath -PathType Container)) {
    throw "Project directory does not exist: $ProjectPath"
}
$projectRoot = (Resolve-Path -LiteralPath $ProjectPath).Path
# Upstream PowerShell feature scripts still interpret these as wildcard paths.
if ($projectRoot.IndexOfAny([char[]]'[]*?') -ge 0) {
    throw 'Spec Kit PowerShell scripts require a project path without [, ], * or ?. Rename the folder before initializing.'
}
$statePath = Join-Path $projectRoot '.specify\integration.json'
$specifyDirectory = Join-Path $projectRoot '.specify'
$skillsDirectory = Join-Path $projectRoot '.agents\skills'

if (Test-Path -LiteralPath $specifyDirectory) {
    if (-not (Test-Path -LiteralPath $statePath -PathType Leaf)) {
        throw 'An existing .specify directory was found without integration.json. Review it before initializing.'
    }
    $state = Get-Content -LiteralPath $statePath -Raw | ConvertFrom-Json
    if ('codex' -notin @($state.installed_integrations) -or
        -not (Test-Path -LiteralPath (Join-Path $skillsDirectory 'speckit-specify\SKILL.md') -PathType Leaf)) {
        throw 'Existing Spec Kit configuration needs review; it will not be overwritten. Use specify integration install codex if appropriate.'
    }
    Write-Host "Spec Kit is already configured in $projectRoot. Existing files were preserved."
    if ($InstallSharedCommand) {
        $null = Install-Tools
        Install-SharedCommand
    }
    exit 0
}

if (Test-Path -LiteralPath $skillsDirectory) {
    $conflicts = @(Get-ChildItem -LiteralPath $skillsDirectory -Force | Where-Object { $_.Name -like 'speckit-*' })
    if ($conflicts.Count -gt 0) { throw 'Existing speckit-* skills were found. Initialization stopped to preserve them.' }
}

$null = Install-Tools
$specify = Resolve-Tool 'specify'
Push-Location -LiteralPath $projectRoot
try {
    & $specify init --here --force --non-interactive --integration codex --script ps --ignore-agent-tools
    if ($LASTEXITCODE -ne 0) { throw 'Spec Kit initialization failed. Review generated files before retrying.' }

    # Neutral defaults only: never copy HOAN Makeup business rules to other apps.
    $constitution = @'
# Project Constitution

## Core Principles

### I. Clear outcomes
For substantial features, record scope, user scenarios, acceptance criteria and
material assumptions before implementation. Reuse the current repository as
context; document the requested change instead of reconstructing the whole app.

### II. Maintain existing contracts
Follow the repository's architecture, conventions and dependencies. Preserve
existing behavior unless the requested change requires otherwise. Describe
compatibility impacts and database migration/recovery steps when applicable.

### III. Verify behavior
Use the existing checks relevant to the change. Add regression coverage for
meaningful bugs and business rules. Report actual results and any unverified
behavior. Documentation or task checkboxes do not replace running checks.

### IV. Keep work proportional
Use spec, plan and tasks for substantial changes. Handle small isolated fixes
with a concise plan and focused verification. Avoid unnecessary dependencies,
ceremony and unrelated refactoring. Preserve credentials and user data.

## Workflow
Read repository instructions and existing docs first. Resolve material unknowns,
implement the authorized scope, and reconcile the code with acceptance criteria.
Update feature artifacts when decisions change. Review generated diffs before
sharing them through Git. Continue authorized work without redundant approvals.

## Governance
Explicit user requirements take precedence. Adapt these defaults to documented
project needs. Record material principle changes and update affected artifacts.

**Version**: 1.0.0 | **Ratified**: DATE_PLACEHOLDER | **Last Amended**: DATE_PLACEHOLDER
'@
    $constitution = $constitution.Replace('DATE_PLACEHOLDER', (Get-Date -Format 'yyyy-MM-dd'))
    [System.IO.File]::WriteAllText((Join-Path $projectRoot '.specify\memory\constitution.md'), "$constitution`n", $utf8)

    $agentRules = @'
<!-- spec-kit-workflow:start -->
## Spec Kit workflow

For substantial features, use the repository's `.agents/skills/speckit-*` skills
and `.specify/memory/constitution.md`: specify, clarify material unknowns, plan,
create tasks, implement and verify acceptance criteria. Keep artifacts under
`specs/<feature>/` current. Select relevant skills from ordinary user requests;
do not require the user to memorize commands. Continue authorized work and ask
only about material decisions that cannot reasonably be inferred. Small fixes
need only a short plan and focused verification. Follow existing project rules,
architecture and test commands. Report actual check results and limitations.
<!-- spec-kit-workflow:end -->
'@
    $agentsPath = Join-Path $projectRoot 'AGENTS.md'
    $existing = if (Test-Path -LiteralPath $agentsPath) { [System.IO.File]::ReadAllText($agentsPath) } else { '' }
    if (-not $existing.Contains('<!-- spec-kit-workflow:start -->')) {
        [System.IO.File]::WriteAllText($agentsPath, ($existing.TrimEnd() + "`n`n" + $agentRules + "`n").TrimStart(), $utf8)
    }
    $attributesPath = Join-Path $projectRoot '.gitattributes'
    $attributes = if (Test-Path -LiteralPath $attributesPath) { [System.IO.File]::ReadAllText($attributesPath) } else { '' }
    if (-not $attributes.Contains('# spec-kit-line-endings')) {
        $rules = "# spec-kit-line-endings`n.agents/skills/speckit-*/SKILL.md text eol=lf`n.specify/** text eol=lf`n"
        [System.IO.File]::WriteAllText($attributesPath, ($attributes.TrimEnd() + "`n`n" + $rules).TrimStart(), $utf8)
    }
} finally {
    Pop-Location
}
if ($InstallSharedCommand) { Install-SharedCommand }
Write-Host "Ready: $projectRoot"
Write-Host 'Review and commit AGENTS.md, .gitattributes, .agents/skills and .specify so other machines receive this setup.'
