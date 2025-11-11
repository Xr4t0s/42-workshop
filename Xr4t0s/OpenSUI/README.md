# 🧬 OpenSui

## 🏗️ Aperçu du projet
Ce projet fait suite au workshop organisé à **42 Paris** par **42 Blockchain**, en collaboration directe avec la **Fondation Sui**.  
Encore merci aux organisateurs, aux participants et au staff de 42 Paris qui ont su nous accueillir comme il se doit.

OpenSui est une **preuve de concept** démontrant l’utilisation de la blockchain **Sui** pour construire des applications véritablement décentralisées.  
Il s’agit d’un **réseau social entièrement on-chain**, où les profils, les posts et les interactions sont stockés sous forme d’objets Move.

Aucune base de données, une maîtrise totale du contenu publié, et une valeur réelle donnée à la parole : voici les principes fondateurs du projet.

> 💡 Pour tester localement, modifiez la ligne commentée dans `vite.config.mts` à la racine pour indiquer le chemin absolu vers le dossier `src/`, ou implémentez votre propre solution dynamique.


---

## 🚀 Fonctionnalités principales

Les fonctionnalités actuellement mises en place sont les suivantes :

1. Création de profil on-chain  
2. Publication de posts  
3. Abonnement à un profil  
4. Like / Unlike d’un post  
5. Commentaire / Suppression de commentaire  
6. Édition / Suppression d’un post  

Nous pourrions à terme intégrer **Walrus** pour le stockage des avatars de profil ou encore du contenu des posts, mais pour l’instant :
- Le contenu des posts est **entièrement on-chain**  
- Le stockage des avatars se fait via **Pinata**

---

## 🧩 Architecture du projet

Le projet se décompose de la manière suivante :
- Le dossier `move/` contient la logique **on-chain**
- Le reste constitue l’application **web**

### Frontend (React + Vite + Radix UI)

La stack front-end est simple et repose sur l’application de base fournie par **Mysten Labs**.  
Elle utilise **React** avec **Vite** comme bundler et **Radix UI** comme bibliothèque d’interface.

L’application est composée de ses **layouts**, de ses **composants**, de **hooks** généraux, d’**outils utilitaires (utils)** et de **fichiers de configuration (config)**.

Chaque composant peut contenir ses micro-composants, ainsi que ses propres utilitaires, hooks ou types spécifiques.  
L’objectif est de rendre l’ajout de nouveaux composants aussi simple que possible.

Le routage est géré dans les dossiers `src/routes/` et `src/App.tsx` (qui référence les routes).  
Il est donc facile d’ajouter de nouveaux chemins ou d’adapter la logique dans `App.tsx` pour intégrer un nouveau composant ou une nouvelle page.

L’application pourrait bien sûr être optimisée, mais nous partons du principe qu’il s’agit d’une **preuve de concept**.  
Libre à vous d’y contribuer ou de proposer des améliorations.

---

### Smart Contracts (Move)

Les modules Move déployés sont les suivants :  

- **Social**  
  > Module parent sur lequel repose l’ensemble du réseau.  

- **Profiles**  
  > Contient les champs `id`, `username`, `description`, `avatar_url` ainsi que les vecteurs `followed` et `following`.  

- **FollowersRegistry**  
- **PostsRegistry**  
- **LikesRegistry**  
- **CommentsRegistry**  
  > Ces quatre objets sont des **Tables** servant de registres et de compteurs, permettant d’éviter les boucles on-chain.  
  > Les interactions viennent modifier ces tables, ce qui permet d’éviter de parcourir toutes les adresses pour retrouver les abonnés ou les éléments liés.

---

### Backend / API

Surprise : **aucun backend ni API** 🎉  
Tout est **entièrement on-chain** (une API pourrait être envisagée pour un futur passage à l’échelle).

---

## 📂 Structure du projet

```bash
src/
 ├─ components/
 ├─ hooks/
 ├─ config/
 ├─ routes/
 ├─ types/
 ├─ utils/
 ├─ App.tsx
 ├─ main.tsx
 └─ style.css
move/
 └─ social/
    ├─ source/
    │   └─ social.move
    └─ Move.toml

