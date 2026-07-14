param (
	[Parameter(Mandatory = $true)][string]$InputFile,
	[Parameter(Mandatory = $true)][string]$OutputFile
)

& magick $InputFile -resize "240x240>" -quality 85 $OutputFile