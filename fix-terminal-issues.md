# Terminal Ongelmien Korjaus

## 🚨 **PowerShell Multi-Line Mode Ongelma**

Kun terminaaliin tulee `>` eri rivillä, se tarkoittaa että PowerShell on **multi-line mode:ssa**.

---

## 🔍 **Miksi tämä tapahtuu:**

### **Syy 1: Puuttuva lainausmerkki**
```powershell
# ❌ Väärin - puuttuva lainausmerkki lopusta
Write-Host "Hello World
>
```

### **Syy 2: Puuttuva sulku**
```powershell
# ❌ Väärin - puuttuva sulku
if ($true) {
    Write-Host "Test"
>
```

### **Syy 3: Keskeytetty komento**
```powershell
# ❌ Painoit Enteriä kesken kirjoittamisen
Get-ChildI
>
```

---

## ✅ **Kuinka korjata:**

### **Vaihtoehto 1: Keskeytä komento**
```powershell
# Paina Ctrl+C peruuttaaksesi
>
^C
PS C:\>
```

### **Vaihtoehto 2: Sulje komento oikein**
```powershell
# Lisää puuttuva lainausmerkki tai sulku
>
"   # Lisää tämä jos puuttuu lainausmerkki
PS C:\>
```

### **Vaihtoehto 3: Aloita uusi istunto**
```powershell
# Sulje PowerShell ja avaa uusi
exit
# Tai avaa uusi PowerShell ikkuna
```

---

## 🛠️ **Ehkäisy:**

### **1. Tarkista aina lainausmerkit**
```powershell
# ✅ Oikein
Write-Host "Hello World"

# ❌ Väärin
Write-Host "Hello World
```

### **2. Tarkista sulut**
```powershell
# ✅ Oikein
if ($true) {
    Write-Host "Test"
}

# ❌ Väärin
if ($true) {
    Write-Host "Test"
# Puuttuu }
```

### **3. Älä paina Enteriä kesken kirjoittamisen**
```powershell
# ✅ Kirjoita koko komento kerralla
Get-ChildItem -Path "C:\temp"

# ❌ Älä tee näin
Get-ChildI
>
tem
>
```

---

## 🎯 **Yksinkertaiset komennot:**

Sen sijaan monimutkaisista komennoista, käytä näitä:

### **Luo tiedosto:**
```powershell
# Yksinkertainen tapa
echo "Hello World" > test.txt
```

### **Kopioi tiedosto:**
```powershell
# Yksinkertainen tapa
copy "source.txt" "destination.txt"
```

### **Luo hakemisto:**
```powershell
# Yksinkertainen tapa
mkdir "uusi-hakemisto"
```

### **Listaa tiedostot:**
```powershell
# Yksinkertainen tapa
dir
# Tai
ls
```

---

## 🔧 **PowerShell Vinkkejä:**

### **1. Käytä Tab-completion:**
```powershell
# Kirjoita alku ja paina Tab
Get-Chi[TAB]  # Täydentyy Get-ChildItem
```

### **2. Käytä alias:**
```powershell
# Sen sijaan Get-ChildItem käytä
ls
# Tai
dir
```

### **3. Käytä yksinkertaisia lainausmerkkejä:**
```powershell
# ✅ Helppo
'Hello World'

# ❌ Vaikeampi
"Hello World"
```

---

## 🚀 **Vaihtoehtoiset työkalut:**

Jos PowerShell aiheuttaa ongelmia, voit käyttää:

### **Command Prompt (cmd):**
```cmd
# Avaa cmd.exe
dir
copy file1.txt file2.txt
```

### **Windows Terminal:**
- Lataa Microsoft Store:sta
- Parempi PowerShell kokemus
- Useampi tab

### **Visual Studio Code Terminal:**
- Käytä VS Code:n sisäänrakennettua terminaalia
- Parempi integraatio projektiin

---

## 📋 **Testaa nämä komennot:**

```powershell
# Testaa nämä yksitellen:

# 1. Yksinkertainen listaus
dir

# 2. Yksinkertainen tiedoston luonti
echo "test" > test.txt

# 3. Tarkista tiedosto
type test.txt

# 4. Poista tiedosto
del test.txt
```

---

## 🎯 **Jos ongelma jatkuu:**

1. **Sulje PowerShell** ja avaa uusi
2. **Käytä yksinkertaisempia komentoja**
3. **Vältä monimutkaisia lainausmerkkejä**
4. **Testaa yksi komento kerrallaan**

---

## ✅ **Hyvä käytäntö:**

```powershell
# ✅ Tee näin:
- Kirjoita koko komento kerralla
- Tarkista lainausmerkit ja sulut
- Paina Enter vain kun komento on valmis
- Käytä yksinkertaisia komentoja

# ❌ Älä tee näin:
- Älä paina Enteriä kesken kirjoittamisen
- Älä jätä lainausmerkkejä auki
- Älä jätä sulkuja auki
```

---

## 🎉 **Yhteenveto:**

**Multi-line mode (`>`) tapahtuu kun:**
- Puuttuu lainausmerkki
- Puuttuu sulku
- Keskeytetty komento

**Korjaus:**
- Paina `Ctrl+C`
- Tai sulje komento oikein
- Tai aloita uusi istunto

**Ehkäisy:**
- Kirjoita koko komento kerralla
- Tarkista syntaksi
- Käytä yksinkertaisia komentoja

**Nyt tiedät miten välttää tämä ongelma!** 🚀
