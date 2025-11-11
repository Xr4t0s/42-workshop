## ⚙️ Installation & lancement

### 1. Cloner le dépôt
```bash
git clone https://github.com/Xr4t0s/OpenSui.git
cd OpenSui
```

---

### 2. Installer les dépendances

Le projet utilise **pnpm** comme gestionnaire de paquets.  
Si vous ne l’avez pas encore installé :

```bash
npm install -g pnpm
```

Ensuite, installez les dépendances du projet :

```bash
pnpm install
```

---

### 3. Configuration de l’environnement (`.env`)

À la racine du projet, créez un fichier `.env` en vous basant sur un modèle (`.env.example`).  
Ce fichier est **requis pour le mode développement local**, notamment pour le stockage des avatars via **Pinata**.

```bash
touch .env
```

Ensuite, modifiez la ligne commentée dans `vite.config.mts` pour y indiquer **le chemin absolu vers votre dossier `src/`**.

> ⚠️ **Attention**  
> Ces clés sont destinées uniquement aux tests locaux.  
> Ne les utilisez pas en production.  
> Vous pouvez obtenir vos clés API sur [https://pinata.cloud](https://pinata.cloud) (section **API Keys**).

---

### 4. Lancer le projet en local
Une fois la configuration terminée, démarrez le serveur de développement :

```bash
pnpm dev
```

L’application sera accessible à l’adresse suivante :  
👉 [http://localhost:5173](http://localhost:5173)

---

### 5. Compiler et déployer les modules Move

Assurez-vous d’avoir la **CLI Sui** installée et configurée :

```bash
sui --version
```

Puis exécutez les commandes suivantes pour compiler et publier les modules **on-chain** :

```bash
sui move build
sui client publish <path_to_move_file>
```

> 💡 Vous pouvez ajuster la valeur du `gas-budget` selon vos besoins.  
> Vérifiez également que votre environnement Sui (`sui client active-env`) est bien configuré sur **testnet** avant le déploiement.

---



