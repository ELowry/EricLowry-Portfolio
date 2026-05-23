param([switch]$Prod)

$vendorDir = "public/vendor"

if ($Prod) {
	Write-Host "Production mode: cleaning vendor folder..."
	if (Test-Path $vendorDir) {
		Remove-Item -Path "$vendorDir/*" -Include * -Recurse -Force
	}
}

# Create vendor directory if it doesn't exist
if (!(Test-Path $vendorDir)) {
	New-Item -ItemType Directory -Force $vendorDir | Out-Null
}

Write-Host "Copying dependencies..."

<#
.SYNOPSIS
Copies a JS file and handles Source Maps based on the $Prod flag.
#>
function Install-VendorLib {
	param(
		[string]$SourceJs,
		[string]$SourceMap,
		[string]$DestBaseName
	)

	$DestJs = "$vendorDir/$DestBaseName.js"
	$DestMap = "$vendorDir/$DestBaseName.js.map"

	# Copy the JS file
	Copy-Item $SourceJs $DestJs

	# Handle Source Maps
	if ($Prod) {
		# PRODUCTION: Strip the source mapping URL to prevent 404 errors
		(Get-Content $DestJs) | 
		Where-Object { $_ -notmatch "sourceMappingURL=" } | 
		Set-Content $DestJs
	}
	else {
		# DEVELOPMENT: Copy map and fix reference collision
		if (Test-Path $SourceMap) {
			Copy-Item $SourceMap $DestMap
            
			# Get the original map filename
			$OriginalMapName = Split-Path $SourceMap -Leaf
            
			# Update the reference in the JS file to point to our renamed map file
			(Get-Content $DestJs) `
				-replace "sourceMappingURL=$OriginalMapName", "sourceMappingURL=$DestBaseName.js.map" `
			| Set-Content $DestJs
		}
	}
}

# Marked and plugins
Install-VendorLib `
	-SourceJs "node_modules/marked/lib/marked.umd.js" `
	-SourceMap "node_modules/marked/lib/marked.umd.js.map" `
	-DestBaseName "marked.min"
Install-VendorLib `
	-SourceJs "node_modules/marked-gfm-heading-id/lib/index.umd.js" `
	-SourceMap "node_modules/marked-gfm-heading-id/lib/index.umd.js.map" `
	-DestBaseName "marked-gfm-heading-id.min"
Install-VendorLib `
	-SourceJs "node_modules/marked-alert/dist/index.umd.js" `
	-SourceMap "node_modules/marked-alert/dist/index.umd.js.map" `
	-DestBaseName "marked-alert.min"
Install-VendorLib `
	-SourceJs "node_modules/marked-responsive-images/dist/index.umd.js" `
	-SourceMap "node_modules/marked-responsive-images/dist/index.umd.js.map" `
	-DestBaseName "marked-responsive-images.min"

# LittleJS
if ($Prod) {
	Copy-Item "node_modules/littlejsengine/dist/littlejs.esm.min.js" "$vendorDir/littlejs.esm.min.js"
}
else {
	Copy-Item "node_modules/littlejsengine/dist/littlejs.esm.js" "$vendorDir/littlejs.esm.js"
	Copy-Item "node_modules/littlejsengine/dist/littlejs.esm.min.js" "$vendorDir/littlejs.esm.min.js"
}

Write-Host "Done."
