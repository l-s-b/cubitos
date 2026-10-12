param(
  [Parameter(Mandatory = $true, Position = 0)]
  [ValidateNotNullOrEmpty()]
  [string]$Message
)

$ErrorActionPreference = 'Stop'

function Invoke-Git {
  param([Parameter(Mandatory = $true)][string[]]$Arguments)

  & git @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "git $($Arguments -join ' ') failed with exit code $LASTEXITCODE."
  }
}

$originalBranch = (& git branch --show-current).Trim()
if ($LASTEXITCODE -ne 0) {
  throw 'Could not determine the current Git branch.'
}
if ($originalBranch -notin @('main', 'private')) {
  throw "Run this script from main or private; current branch is '$originalBranch'."
}

$otherBranch = if ($originalBranch -eq 'main') { 'private' } else { 'main' }
foreach ($branch in @($originalBranch, $otherBranch)) {
  & git show-ref --verify --quiet "refs/heads/$branch"
  if ($LASTEXITCODE -ne 0) {
    throw "Required local branch '$branch' does not exist."
  }
}

$gitDir = (& git rev-parse --git-dir).Trim()
if ($LASTEXITCODE -ne 0) {
  throw 'Could not determine the Git directory.'
}
foreach ($operation in @('MERGE_HEAD', 'CHERRY_PICK_HEAD', 'REVERT_HEAD', 'rebase-merge', 'rebase-apply')) {
  if (Test-Path (Join-Path $gitDir $operation)) {
    throw "A Git operation is already in progress ($operation). Finish or abort it before releasing."
  }
}

& git add --all
if ($LASTEXITCODE -ne 0) {
  throw 'Could not stage all changes.'
}

$changes = & git status --porcelain
if ($LASTEXITCODE -ne 0) {
  throw 'Could not inspect the staged changes.'
}
if (-not $changes) {
  Write-Output 'No changes to commit.'
  exit 0
}

$commitArguments = @('commit', '-m', $Message)
if ($Message -notmatch '(?m)^Co-authored-by:') {
  $commitArguments += @('-m', 'Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>')
}
Invoke-Git $commitArguments

$sourceCommit = (& git rev-parse HEAD).Trim()
if ($LASTEXITCODE -ne 0) {
  throw 'Could not determine the new commit.'
}

try {
  Invoke-Git @('switch', $otherBranch)
  Invoke-Git @('cherry-pick', $sourceCommit)
  Invoke-Git @('switch', 'main')
  Invoke-Git @('push', 'origin', 'main')
  Invoke-Git @('switch', $originalBranch)
} catch {
  $cherryPickHead = (& git rev-parse --git-path CHERRY_PICK_HEAD).Trim()
  if (Test-Path $cherryPickHead) {
    & git cherry-pick --abort
  }

  $currentBranch = (& git branch --show-current).Trim()
  if ($currentBranch -ne $originalBranch) {
    & git switch $originalBranch
  }

  throw "Release stopped safely: $($_.Exception.Message) The source commit $sourceCommit remains on '$originalBranch'; only main is ever pushed."
}

Write-Output "Committed $sourceCommit on '$originalBranch', cherry-picked to '$otherBranch', and pushed main to origin."
