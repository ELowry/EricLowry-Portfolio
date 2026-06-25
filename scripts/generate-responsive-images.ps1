<#
.SYNOPSIS
Generates responsive image variants (WebP + JPG/PNG) for use with the MarkedResponsiveImages extension.

.DESCRIPTION
This script uses ImageMagick (magick) to take an input image and generate a hardcoded set of width variants. 
It automatically detects transparency to output PNG fallbacks instead of JPGs if necessary. 
The output files are named using a specific tokenized convention so they can be parsed by the MarkedResponsiveImages JS extension.

.PARAMETER InputFile
The full or relative path to the source image you want to process.

.PARAMETER DestinationFolder
The folder where the generated images will be saved. The folder will be created if it does not exist.

.PARAMETER ForceTransparency
A switch that forces the fallback images to be generated as .png instead of .jpg, bypassing the automatic transparency detection.

.PARAMETER OutputName
An optional string to override the base filename of the output images. If omitted, the script uses the name of the InputFile.

.PARAMETER MaxSize
The maximum allowable dimension (width or height) for the largest generated image variant. Default is 2000.
#>
param (
	[Parameter(Mandatory = $true)]
	[string]$InputFile,

	[Parameter(Mandatory = $true)]
	[string]$DestinationFolder,

	[switch]$ForceTransparency,

	[string]$OutputName,

	[int]$MaxSize = 1920
)

# CONFIGURATION

# Hardcoded array of desired widths
$targetWidths = @(240, 400, 600, 820, 1400, 1920)

# Target quality for each type
$qualityWebP = 85
$qualityJPG = 88
$qualityPNG = 95

# EXECUTION

# Save the original string for the Markdown output later
$markdownDestFolder = $DestinationFolder

# CHECK FOR IMAGEMAGICK (v7+)

try {
	# Attempt to run magick and grab the first line of the output
	$magickOutput = & magick -version
	$versionLine = $magickOutput | Select-Object -First 1

	# Extract the major version number using regex
	if ($versionLine -match 'ImageMagick (\d+)\.') {
		$majorVersion = [int]$Matches[1]
		
		if ($majorVersion -lt 7) {
			Write-Host "Warning: ImageMagick v7 or higher is required, but v$majorVersion was detected." -ForegroundColor Yellow
			Write-Host 'Please update ImageMagick: https://imagemagick.org/download/#windows' -ForegroundColor Yellow
			pause
			exit
		}
	}
 else {
		# Force a throw if the command runs but the output format is completely unexpected
		throw 'Unrecognized ImageMagick version format.'
	}
}
catch {
	Write-Host "Warning: ImageMagick ('magick' command) was not found on this system." -ForegroundColor Yellow
	Write-Host 'This script requires ImageMagick v7+ to resize and format images.' -ForegroundColor Yellow
	Write-Host '1. Download it here: https://imagemagick.org/download/#windows' -ForegroundColor Yellow
	Write-Host "2. Ensure 'Install legacy utilities' or 'Add to PATH' is checked during installation." -ForegroundColor Yellow
	pause
	exit
}

# VALIDATE INPUT

if (-not (Test-Path $InputFile)) {
	Write-Error "Input file not found: $InputFile"
	return
}

# Ensure destination exists
if (-not (Test-Path $DestinationFolder)) {
	New-Item -ItemType Directory -Path $DestinationFolder -Force | Out-Null
}

# Force the path to be absolute so ImageMagick never gets confused by hyphens
$DestinationFolder = (Resolve-Path $DestinationFolder).Path

# SET BASE FILENAME

if ([string]::IsNullOrWhiteSpace($OutputName)) {
	$baseName = [System.IO.Path]::GetFileNameWithoutExtension($InputFile)
}
else {
	$baseName = $OutputName
}

# GET FILE DIMENSIONS

$dimsStr = & magick identify -format '%w %h' $InputFile
$dims = $dimsStr -split ' '
$origW = $dims[0] -as [int]
$origH = $dims[1] -as [int]

if (-not $origW -or -not $origH) {
	Write-Error "Failed to read dimensions for $InputFile using ImageMagick."
	return
}

# DETECT TRANSPARENCY

$fallbackExt = 'jpg'
if ($ForceTransparency) {
	$fallbackExt = 'png'
}
else {
	# %[opaque] returns 'true' if the image has NO transparent pixels. 
	# If it returns 'false', transparency exists.
	$isOpaque = & magick identify -format '%[opaque]' $InputFile
	if ($isOpaque -match 'false') {
		$fallbackExt = 'png'
	}
}

# GET MAX WIDTH

$effectiveMaxW = $origW

if ($MaxSize -gt 0) {
	if ($origW -gt $MaxSize -or $origH -gt $MaxSize) {
		if ($origW -ge $origH) {
			$effectiveMaxW = $MaxSize
		}
		else {
			$effectiveMaxW = [math]::Round($origW * ($MaxSize / $origH))
		}
	}
}

$validWidths = @($targetWidths | Where-Object { $_ -lt $effectiveMaxW })
if ($effectiveMaxW -notin $validWidths) {
	$validWidths += $effectiveMaxW
}
$validWidths = $validWidths | Sort-Object

# BUILD IMAGES

$tokens = @()
$generatedWebPs = @()
$generatedFallbacks = @()

foreach ($w in $validWidths) {
	Write-Host "Processing width: ${w}px..."

	# Generate WebP
	$tempWebp = Join-Path $DestinationFolder "temp_$w.webp"
	& magick $InputFile -resize "${w}x" -quality $qualityWebP $tempWebp
    
	# Read output sizes to avoid rounding errors
	$dimsOut = (& magick identify -format '%w %h' $tempWebp) -split ' '
	$actualW = [int]$dimsOut[0]
	$actualH = [int]$dimsOut[1]

	# Store WebP info to rename later
	$webpName = "${baseName}__${actualW}-${actualH}.webp"
	$webpPath = Join-Path $DestinationFolder $webpName
	$generatedWebPs += [PSCustomObject]@{
		TempPath  = $tempWebp
		FinalPath = $webpPath
	}

	# Add format token
	$tokens += "${actualW}-${actualH}-webp"

	# Generate Fallback Images
	$tempFallback = Join-Path $DestinationFolder "temp_$w.$fallbackExt"
	if ($fallbackExt -eq 'jpg') {
		& magick $InputFile -resize "${w}x" -quality $qualityJPG $tempFallback
	}
 else {
		& magick $InputFile -resize "${w}x" -quality $qualityPNG $tempFallback
	}

	$generatedFallbacks += [PSCustomObject]@{
		Width    = $actualW
		Height   = $actualH
		TempPath = $tempFallback
		IsLast   = ($w -eq $validWidths[-1])
	}

	$tokens += "${actualW}-${actualH}"
}

# PROCESS FILENAMES

$tokenString = $tokens -join '_'
$mainFileName = "${baseName}__${tokenString}.$fallbackExt"

# Check for Conflicts
$allTargetPaths = @()
foreach ($file in $generatedWebPs) {
	$allTargetPaths += $file.FinalPath
}

foreach ($file in $generatedFallbacks) {
	if ($file.IsLast) {
		$allTargetPaths += (Join-Path $DestinationFolder $mainFileName)
	}
 else {
		$allTargetPaths += (Join-Path $DestinationFolder "${baseName}__$($file.Width)-$($file.Height).$fallbackExt")
	}
}

$existing = $allTargetPaths | Where-Object { Test-Path $_ }
if ($existing.Count -gt 0) {
	Write-Host "`nConflict(s) detected. The following file(s) already exist:" -ForegroundColor Yellow
	foreach ($path in $existing) {
		Write-Host " - $(Split-Path $path -Leaf)"
	}
	$choice = Read-Host "`nDo you want to overwrite these files? (y/n)"
	if ($choice -notmatch '^y$') {
		Write-Host "`nOperation cancelled by user. Temporary files remain in destination folder." -ForegroundColor Red
		return
	}
}

# MOVE FILES

foreach ($file in $generatedWebPs) {
	Move-Item -Path $file.TempPath -Destination $file.FinalPath -Force
}

foreach ($file in $generatedFallbacks) {
	if ($file.IsLast) {
		$finalPath = Join-Path $DestinationFolder $mainFileName
	}
 else {
		$finalName = "${baseName}__$($file.Width)-$($file.Height).$fallbackExt"
		$finalPath = Join-Path $DestinationFolder $finalName
	}
	Move-Item -Path $file.TempPath -Destination $finalPath -Force
}

# RETURN MARKDOWN STRING

$markdownPath = "$markdownDestFolder/$mainFileName".Replace('\', '/')

Write-Host "`nSuccess! Add the following to your Markdown:`n" -ForegroundColor Green
Write-Host "![Your Alt Text]($markdownPath)`n" -ForegroundColor Cyan