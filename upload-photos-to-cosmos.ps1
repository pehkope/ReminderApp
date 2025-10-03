# Hae connection string
$connectionString = az cosmosdb keys list `
    --name reminderapp-cosmos2025 `
    --resource-group ReminderApp-RG `
    --type connection-strings `
    --query "connectionStrings[0].connectionString" `
    -o tsv

Write-Host "Connection string: $($connectionString.Substring(0,50))..."

# Asenna Cosmos SDK jos ei ole
if (-not (Get-Module -ListAvailable -Name Microsoft.Azure.Cosmos)) {
    Write-Host "Installing Cosmos SDK..."
    Install-Module -Name Microsoft.Azure.Cosmos -Force -Scope CurrentUser
}

# Lataa valokuvia
$cosmos = New-CosmosDbContext -ConnectionString $connectionString -Database "ReminderAppDB"

foreach ($file in Get-ChildItem "photo-mom-*.json") {
    $json = Get-Content $file.FullName -Raw
    $photo = $json | ConvertFrom-Json
    
    Write-Host "Uploading: $($photo.id) - $($photo.caption)"
    
    try {
        New-CosmosDbDocument `
            -Context $cosmos `
            -CollectionId "Photos" `
            -DocumentBody $json `
            -PartitionKey $photo.clientId
        
        Write-Host "✓ Uploaded $($photo.id)" -ForegroundColor Green
    }
    catch {
        Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "Done!"

