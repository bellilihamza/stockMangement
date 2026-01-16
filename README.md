# 📦 Système de Gestion de Stock - Guide d'Utilisation

## 🚀 Démarrage Rapide

### Option 1: Exécutable Windows (.exe) - **RECOMMANDÉ**
1. Ouvrez le dossier **`dist`**
2. Double-cliquez sur **`GestionStock.exe`**
3. L'application démarre et affiche l'URL dans la console
4. Ouvrez votre navigateur à l'adresse: **http://127.0.0.1:5000**

> **Avantage:** Aucune installation de Python requise! L'exécutable contient tout le nécessaire.

### Option 2: Lancer avec Python
1. Ouvrez le dossier **`gestion-stock`**
2. Double-cliquez sur **`start_stock.bat`**
3. L'application s'ouvre automatiquement dans votre navigateur

> **Note:** Python doit être installé sur votre système. Si ce n'est pas le cas, téléchargez-le depuis https://www.python.org/

---

## 🔨 Créer l'Exécutable (Pour Développeurs)

### Construire le .exe

1. **Installation des dépendances:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Lancer la construction:**
   - Double-cliquez sur **`build.bat`**
   - OU exécutez dans le terminal:
     ```bash
     pyinstaller --clean gestion_stock.spec
     ```

3. **Résultat:**
   - L'exécutable sera créé dans le dossier **`dist/GestionStock.exe`**
   - Taille approximative: 50-80 MB (inclut Python et toutes les dépendances)

### Distribution

Pour distribuer l'application à d'autres utilisateurs:
1. Copiez le fichier **`dist/GestionStock.exe`**
2. L'utilisateur peut le lancer directement sans installer Python
3. Les fichiers Excel (`data/stock.xlsx`, `data/historique.xlsx`) seront créés automatiquement au premier lancement

> **Important:** L'exécutable crée les fichiers de données dans le même dossier où il est exécuté.



---

## 📖 Guide d'Utilisation

### ➕ Ajouter un Article

1. Cliquez sur le bouton **"Ajouter un Article"** (bleu)
2. Remplissez le formulaire:
   - **Nom de l'Article:** Le nom du produit
   - **Stock:** La quantité actuelle en stock
   - **Prix (DA):** Le prix unitaire en Dinars Algériens
   - **Stock Minimum:** Le seuil d'alerte (quand le stock descend à ce niveau, une alerte apparaît)
3. Cliquez sur **"Enregistrer"**
4. L'article apparaît immédiatement dans le tableau

### ✏️ Modifier un Article

1. Trouvez l'article dans le tableau
2. Cliquez sur le bouton **"Modifier"** (jaune)
3. Modifiez les informations souhaitées
4. Cliquez sur **"Enregistrer"**
5. Les changements sont sauvegardés dans le fichier Excel

### 🗑️ Supprimer un Article

1. Trouvez l'article dans le tableau
2. Cliquez sur le bouton **"Supprimer"** (rouge)
3. Confirmez la suppression
4. L'article est retiré de la base de données

### 💰 Effectuer une Vente

1. Cliquez sur le bouton **"Effectuer une Vente"** (vert)
2. Sélectionnez l'article à vendre dans la liste déroulante
3. Entrez la quantité à vendre
4. Un aperçu s'affiche avec:
   - Le prix total de la vente
   - Le stock restant après la vente
   - Une alerte si le stock sera faible
5. Cliquez sur **"Valider la Vente"**
6. Le système:
   - Vérifie que le stock est suffisant
   - Déduit la quantité du stock
   - Enregistre la vente dans l'historique
   - Affiche un message de confirmation avec le total

### 🔄 Actualiser les Données

- Cliquez sur le bouton **"Actualiser"** (cyan) pour recharger les données depuis les fichiers Excel

---

## ⚠️ Système d'Alertes

### Alertes Visuelles
- **Ligne Rouge:** Les articles dont le stock est inférieur ou égal au stock minimum sont surlignés en rouge
- **Icône ⚠️:** Apparaît à côté de la quantité en stock pour les articles en alerte

### Notifications
- **Popup:** Messages de succès/erreur apparaissent en haut à droite de l'écran
- **Notifications Windows:** Des notifications de bureau apparaissent automatiquement pour les stocks faibles

---

## 📊 Fichiers de Données

### `data/stock.xlsx`
Contient l'inventaire complet avec les colonnes:
- **id:** Identifiant unique de l'article
- **nom_article:** Nom du produit
- **stock:** Quantité actuelle
- **prix:** Prix unitaire
- **min_stock:** Seuil d'alerte

### `data/historique.xlsx`
Enregistre toutes les ventes avec:
- **date:** Date et heure de la vente
- **nom_article:** Produit vendu
- **quantite:** Quantité vendue
- **prix_total:** Montant total de la vente

> **Important:** Vous pouvez ouvrir ces fichiers Excel directement pour consulter ou exporter les données

---

## ❌ Gestion des Erreurs

### Stock Insuffisant
Si vous tentez de vendre plus que le stock disponible, le système affiche:
> ❌ **Erreur:** Stock insuffisant! Disponible: X, Demandé: Y

### Champs Invalides
Tous les champs sont validés. Assurez-vous de:
- Remplir tous les champs obligatoires
- Entrer des nombres valides pour le stock, prix et quantité
- Ne pas utiliser de caractères spéciaux dans les noms

---

## 🛠️ Dépannage

### L'application ne démarre pas
1. Vérifiez que Python est installé: `python --version`
2. Installez les dépendances: `python -m pip install -r requirements.txt`
3. Lancez manuellement: `python app.py`

### Les données ne se sauvegardent pas
1. Vérifiez que le dossier `data/` existe
2. Assurez-vous que les fichiers Excel ne sont pas ouverts dans Excel
3. Vérifiez les permissions d'écriture sur le dossier

### Les notifications ne s'affichent pas
1. Autorisez les notifications dans votre navigateur
2. Vérifiez les paramètres de notification Windows

---

## 💡 Conseils d'Utilisation

✅ **Définissez des stocks minimums réalistes** pour éviter les ruptures de stock  
✅ **Consultez régulièrement l'historique** pour analyser vos ventes  
✅ **Sauvegardez les fichiers Excel** régulièrement (copiez le dossier `data/`)  
✅ **Fermez Excel** avant de modifier les données via l'application  
✅ **Utilisez le bouton Actualiser** si vous modifiez les fichiers Excel manuellement  

---

## 📞 Support

Pour toute question ou problème:
1. Vérifiez ce guide d'utilisation
2. Consultez les messages d'erreur affichés par l'application
3. Vérifiez les fichiers Excel pour l'intégrité des données

---

**Version:** 1.0  
**Date:** Janvier 2026  
**Système:** Windows - Fonctionne 100% hors ligne
