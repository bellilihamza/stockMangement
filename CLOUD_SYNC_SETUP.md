# 🚀 Guide d'Installation - Synchronisation Cloud

## ⚠️ IMPORTANT : Configuration Google Sheets

Avant de lancer l'application avec la synchronisation cloud, vous devez configurer Google Sheets :

### Étape 1 : Créer un Google Spreadsheet

1. Allez sur [Google Sheets](https://sheets.google.com)
2. Créez un nouveau tableur (spreadsheet)
3. Nommez-le comme vous voulez (ex: "Stock Manager Cloud")

### Étape 2 : Partager avec le Service Account

1. Cliquez sur **Partager** (bouton en haut à droite)
2. Ajoutez cette adresse email :
   ```
   stockmanagerbot@durable-trainer-441320-i1.iam.gserviceaccount.com
   ```
3. Donnez-lui les droits **Éditeur** (Editor)
4. Cliquez sur **Envoyer**

### Étape 3 : Copier l'ID du Spreadsheet

1. Regardez l'URL de votre Google Sheet :
   ```
   https://docs.google.com/spreadsheets/d/VOTRE_SPREADSHEET_ID/edit
   ```
2. Copiez la partie `VOTRE_SPREADSHEET_ID`
3. Ouvrez le fichier `config.py`
4. Remplacez `YOUR_SPREADSHEET_ID_HERE` par votre ID :
   ```python
   SPREADSHEET_ID = "1a2b3c4d5e6f7g8h9i0j"  # Votre vrai ID ici
   ```

### Étape 4 : Installer les Dépendances

Ouvrez un terminal dans le dossier du projet et exécutez :

```bash
pip install -r requirements.txt
```

Cela installera :
- Flask (serveur web)
- pandas (manipulation de données)
- openpyxl (lecture/écriture Excel)
- gspread (API Google Sheets)
- google-auth (authentification Google)

### Étape 5 : Lancer l'Application

```bash
python app.py
```

L'application sera disponible sur : http://127.0.0.1:5000

---

## 🎯 Comment Utiliser la Synchronisation

### Badge de Statut

Le badge en haut à gauche affiche l'état de connexion :

- 🟢 **En ligne** : Connecté à Internet, prêt à synchroniser
- 🔴 **Hors ligne** : Pas de connexion Internet
- 🟡 **Synchronisation...** : Synchronisation en cours
- 🔵 **Restauré** : Données restaurées depuis le cloud

### Bouton "☁️ Synchroniser"

1. Cliquez sur le bouton **"☁️ Synchroniser"** dans la barre du haut
2. L'application va :
   - Vérifier la connexion Internet
   - Envoyer vos données locales vers Google Sheets
   - Afficher un message de succès ou d'erreur

### Synchronisation Automatique au Démarrage

- Si les fichiers `stock.xlsx` ou `historique.xlsx` sont manquants
- ET que vous avez une connexion Internet
- L'application restaurera automatiquement les données depuis Google Sheets

### Mode Hors Ligne

- L'application fonctionne **100% hors ligne**
- Vous pouvez ajouter, modifier, supprimer des articles
- Vous pouvez faire des ventes
- Quand vous revenez en ligne, cliquez sur "Synchroniser" pour envoyer vos changements

---

## 📊 Structure Google Sheets

Après la première synchronisation, votre Google Sheet contiendra 2 feuilles :

### Feuille "stock"
| id | nom_article | stock | prix | min_stock |
|----|-------------|-------|------|-----------|
| 1  | Laptop Dell | 15    | 45000| 5         |
| 2  | Souris      | 3     | 1500 | 10        |

### Feuille "historique"
| date                | nom_article | quantite | prix_total |
|---------------------|-------------|----------|------------|
| 2026-01-17 00:30:00 | Laptop Dell | 2        | 90000      |

---

## 🔧 Dépannage

### Erreur "Pas de connexion Internet"
- Vérifiez votre connexion Internet
- Le badge doit être 🟢 pour synchroniser

### Erreur "Erreur d'authentification Google"
- Vérifiez que le fichier `durable-trainer-441320-i1-ec5a883cb870.json` existe
- Vérifiez que vous avez bien partagé le Google Sheet avec le service account

### Erreur "Spreadsheet introuvable"
- Vérifiez que l'ID dans `config.py` est correct
- Vérifiez que vous avez bien partagé le sheet avec le service account

### Le badge reste 🔴 Hors ligne
- Vérifiez votre connexion Internet
- Le badge se met à jour automatiquement toutes les 10 secondes

---

## 📝 Notes Importantes

1. **Sécurité** : Ne synchronisez JAMAIS si votre stock local est vide (protection intégrée)
2. **Source de vérité** : Google Sheets est la source de vérité en cas de conflit
3. **Sauvegarde** : Synchronisez régulièrement pour ne pas perdre vos données
4. **Restauration** : En cas de perte des fichiers locaux, relancez l'app avec Internet

---

## 🎉 C'est Prêt !

Vous pouvez maintenant :
- ✅ Gérer votre stock localement
- ✅ Synchroniser avec Google Sheets en un clic
- ✅ Travailler hors ligne
- ✅ Restaurer vos données automatiquement
