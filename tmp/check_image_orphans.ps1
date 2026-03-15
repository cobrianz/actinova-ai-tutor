
$publicFiles = @(
    "avatar1.jpg", "avatar2.jpg", "avatar3.jpg", "avatar4.jpg", "avatar5.jpg",
    "avatar6.jpg", "avatar7.jpg", "avatar8.jpg", "avatar9.jpg", "avatar10.jpg",
    "avatar11.jpg", "avatar12.jpg", "avatar13.jpg", "avatar14.jpg", "avatar15.jpg",
    "avatar16.jpg", "avatar17.jpg", "logo.png"
)

foreach ($file in $publicFiles) {
    $usage = Get-ChildItem -Path f:\Actinova\actinova-ai-tutor\src -Recurse -File | Select-String -Pattern "$file"
    if ($usage -eq $null) {
        Write-Host "ORPHAN IMAGE FOUND: $file"
    } else {
        # Write-Host "Used: $file"
    }
}
