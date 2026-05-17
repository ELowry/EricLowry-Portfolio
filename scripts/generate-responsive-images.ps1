<#
.SYNOPSIS
Generates responsive image variants (WebP + JPG/PNG) for use with the MarkedResponsiveImages extension.

.DESCRIPTION
This script uses ImageMagick (magick) to take an input image and generate a hardcoded set of width variants (240, 400, 600, 820, 1400, 1920). 
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

.EXAMPLE
.\generate-responsive-images.ps1 -InputFile ".\src\hero.jpg" -DestinationFolder ".\public\assets"
Processes 'hero.jpg' and outputs variants to the 'assets' folder using 'hero' as the base name.

.EXAMPLE
.\generate-responsive-images.ps1 -InputFile ".\src\game3.png" -DestinationFolder "..\assets" -OutputName "banner" -ForceTransparency
Forces PNG output and renames the generated files to start with 'banner__' instead of 'game3__'.
#>
param (
	[Parameter(Mandatory = $true)]
	[string]$InputFile,

	[Parameter(Mandatory = $true)]
	[string]$DestinationFolder,

	[switch]$ForceTransparency,

	[string]$OutputName
)

# CONFIGURATION
# Hardcoded array of desired widths
$TargetWidths = @(240, 400, 600, 820, 1400, 1920)

# Target quality for each type
$QualityWebP = 85
$QualityJPG = 88
$QualityPNG = 95

# Save the original string for the Markdown output later
$MarkdownDestFolder = $DestinationFolder

# CHECK FOR IMAGEMAGICK (v7+)
try {
	# Attempt to run magick and grab the first line of the output
	$magickOutput = & magick -version
	$versionLine = $magickOutput | Select-Object -First 1

	# Extract the major version number using regex
	if ($versionLine -match "ImageMagick (\d+)\.") {
		$majorVersion = [int]$Matches[1]
		
		if ($majorVersion -lt 7) {
			Write-Host "Warning: ImageMagick v7 or higher is required, but v$majorVersion was detected." -ForegroundColor Yellow
			Write-Host "Please update ImageMagick: https://imagemagick.org/download/#windows" -ForegroundColor Yellow
			pause
			exit
		}
	}
	else {
		# Force a throw if the command runs but the output format is completely unexpected
		throw "Unrecognized ImageMagick version format."
	}
}
catch {
	Write-Host "Warning: ImageMagick ('magick' command) was not found on this system." -ForegroundColor Yellow
	Write-Host "This script requires ImageMagick v7+ to resize and format images." -ForegroundColor Yellow
	Write-Host "1. Download it here: https://imagemagick.org/download/#windows" -ForegroundColor Yellow
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
	$BaseName = [System.IO.Path]::GetFileNameWithoutExtension($InputFile)
}
else {
	$BaseName = $OutputName
}

# GET FILE DIMENSIONS
# We only need the width to calculate our target array
$widthStr = & magick identify -format "%w" $InputFile
$OrigW = $widthStr -as [int]

if (-not $OrigW) {
	Write-Error "Failed to read width for $InputFile using ImageMagick."
	return
}

# DETECT TRANSPARENCY
$FallbackExt = "jpg"
if ($ForceTransparency) {
	$FallbackExt = "png"
}
else {
	# %[opaque] returns 'true' if the image has NO transparent pixels. 
	# If it returns 'false', transparency exists.
	$isOpaque = & magick identify -format "%[opaque]" $InputFile
	if ($isOpaque -match "false") {
		$FallbackExt = "png"
	}
}

# GET MAX WIDTH
$ValidWidths = @($TargetWidths | Where-Object { $_ -lt $OrigW })
if ($OrigW -notin $ValidWidths) {
	$ValidWidths += $OrigW
}
$ValidWidths = $ValidWidths | Sort-Object

# BUILD IMAGES
$Tokens = @()
$GeneratedWebPs = @()
$GeneratedFallbacks = @()

foreach ($W in $ValidWidths) {
	Write-Host "Processing width: ${W}px..."

	# Generate WebP
	$tempWebp = Join-Path $DestinationFolder "temp_$W.webp"
	& magick $InputFile -resize "${W}x" -quality $QualityWebP $tempWebp
    
	# Read output sizes to avoid rounding errors
	$dims = (& magick identify -format "%w %h" $tempWebp) -split " "
	$ActualW = [int]$dims[0]
	$ActualH = [int]$dims[1]

	# Store WebP info to rename later
	$webpName = "${BaseName}__${ActualW}-${ActualH}.webp"
	$webpPath = Join-Path $DestinationFolder $webpName
	$GeneratedWebPs += [PSCustomObject]@{
		TempPath  = $tempWebp
		FinalPath = $webpPath
	}

	# Add format token
	$Tokens += "${ActualW}-${ActualH}-webp"

	# Generate Fallback Images
	$tempFallback = Join-Path $DestinationFolder "temp_$W.$FallbackExt"
	if ($FallbackExt -eq "jpg") {
		& magick $InputFile -resize "${W}x" -quality $QualityJPG $tempFallback
	}
	else {
		& magick $InputFile -resize "${W}x" -quality $QualityPNG $tempFallback
	}

	# Store fallback info to rename later
	$GeneratedFallbacks += [PSCustomObject]@{
		Width    = $ActualW
		Height   = $ActualH
		TempPath = $tempFallback
		IsLast   = ($W -eq $ValidWidths[-1])
	}

	$Tokens += "${ActualW}-${ActualH}"
}

# PROCESS FILENAMES
$TokenString = $Tokens -join "_"
$MainFileName = "${BaseName}__${TokenString}.$FallbackExt"

# Check for Conflicts
$AllTargetPaths = @()
foreach ($file in $GeneratedWebPs) { $AllTargetPaths += $file.FinalPath }
foreach ($file in $GeneratedFallbacks) {
	if ($file.IsLast) {
		$AllTargetPaths += (Join-Path $DestinationFolder $MainFileName)
	}
	else {
		$AllTargetPaths += (Join-Path $DestinationFolder "${BaseName}__$($file.Width)-$($file.Height).$FallbackExt")
	}
}

$Existing = $AllTargetPaths | Where-Object { Test-Path $_ }
if ($Existing.Count -gt 0) {
	Write-Host "`nConflict(s) detected. The following file(s) already exist:" -ForegroundColor Yellow
	foreach ($path in $Existing) {
		Write-Host " - $(Split-Path $path -Leaf)"
	}
	$choice = Read-Host "`nDo you want to overwrite these files? (y/n)"
	if ($choice -notmatch "^y$") {
		Write-Host "`nOperation cancelled by user. Temporary files remain in destination folder." -ForegroundColor Red
		return
	}
}

# Perform Moves
foreach ($file in $GeneratedWebPs) {
	Move-Item -Path $file.TempPath -Destination $file.FinalPath -Force
}

foreach ($file in $GeneratedFallbacks) {
	if ($file.IsLast) {
		# Default file
		$finalPath = Join-Path $DestinationFolder $MainFileName
	}
	else {
		# Variants
		$finalName = "${BaseName}__$($file.Width)-$($file.Height).$FallbackExt"
		$finalPath = Join-Path $DestinationFolder $finalName
	}
	Move-Item -Path $file.TempPath -Destination $finalPath -Force
}

# Format the output string for Markdown (force forward slashes)
$MarkdownPath = "$MarkdownDestFolder/$MainFileName".Replace('\', '/')

Write-Host "`nSuccess! Add the following to your Markdown:`n" -ForegroundColor Green
Write-Host "![Your Alt Text]($MarkdownPath)`n" -ForegroundColor Cyan