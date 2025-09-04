# GitHub Actions - Pikakaynnistys

## Valmiit tiedostot

Kaikki tarvittava on jo luotu:

1. `.github/workflows/azure-functions-deploy.yml` - Deployment workflow
2. `setup-github-secrets.ps1` - Azure credentials setup
3. `test-github-deployment.ps1` - API testaus

## Aloitus

### Vaihe 1: Aja credentials setup
```powershell
.\setup-github-secrets.ps1
```

### Vaihe 2: Kopioi GitHub:iin
- Mene GitHub repositoryyn
- Settings - Secrets and variables - Actions
- Lisaa AZURE_CREDENTIALS ja AZURE_FUNCTIONAPP_PUBLISH_PROFILE

### Vaihe 3: Testaa
```bash
git add .
git commit -m "Add GitHub Actions"
git push origin main
```

## Valmis!

Kun pushaat main branchiin, deployment tapahtuu automaattisesti Azureen.

## Tarkistus

- GitHub Actions tab nayttaa deployment status
- Azure Portal nayttaa function deployment
- Test script vahvistaa API toimivuuden
