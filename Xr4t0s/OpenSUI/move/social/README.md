# Social on Sui 🧵

Petit réseau social **fully on-chain** construit sur la blockchain **Sui**.

L’idée : chaque action importante (créer un profil, suivre, poster, liker, commenter) devient un **objet Move** ou un **événement on-chain**. Pas de base de données off-chain : tout ce qui compte vit dans l’état Sui.

---

## 🧩 Architecture générale

Le package est organisé autour de deux modules principaux :

- **`social::social`** – cœur du protocole
  - Définit tous les objets métier (Profile, Post, Like, Follow, Comment…)
  - Définit les registres globaux (ProfilesRegistry, PostsRegistry, LikesRegistry…)
  - Expose les fonctions publiques appelées par le front-end

- **`social::utils`** – helpers génériques
  - Fonctions utilitaires sur `vector<address>`
    - `contains_addr`
    - `remove_first_addr`

---

## 🧱 Objets on-chain

### 👤 Profile
Représente un profil utilisateur.

- `owner`: wallet propriétaire
- `username`, `description`, `avatar_url`: infos publiques
- `followed`: profils suivis par ce profil
- `followers`: placeholder pour plus tard

### 👣 Follow (NFT de follow)
Représente une relation on-chain: **A suit B**.

- Possédé par le follower
- Permet le unfollow en brûlant l’objet

### 📝 Post
Post texte simple publié par un profil.

- Auteur = profil + wallet
- Timestamps en millisecondes

### ❤️ Like (NFT de like)
Un like = un objet NFT.

- Empêche les doublons grâce à `LikeKey`
- Permet le unlike en brûlant l’objet

### 💬 Comment
Commentaire lié à un Post.

- Même pattern que Post (timestamps, auteur…)

---

## 📚 Registres globaux (shared objects)

### ProfilesRegistry
- Liste globale des profils
- Mapping `owner -> profile_id`

### FollowersRegistry
- Compteur de followers par profil

### PostsRegistry
- Pour chaque profil : liste et compteur des posts

### LikesRegistry + LikeKey
- Empêche les likes doublons
- Stocke l’ID du NFT Like

### CommentsRegistry
- Pour chaque post : liste et compteur des commentaires

---

## ⚙️ API du module `social::social`

### Profils
- `create_profile`
- `create_profile_with_avatar`
- `set_avatar_url`

### Follow
- `follow`
- `unfollow`

### Posts
- `publish_post`
- `edit_post`
- `delete_post`

### Likes
- `like_post`
- `unlike_post`

### Comments
- `add_comment`
- `edit_comment`
- `delete_comment`

### Getters
- `is_following`
- `followers_count`
- `likes_count`
- `comments_count`
- `posts_count`

---

## 🔧 Module `social::utils`

Helpers pour garder le code propre :

- `contains_addr` — teste si une adresse est dans un vector
- `remove_first_addr` — supprime une adresse d’un vector

Utilisés pour follow, comments, posts, etc.

---

## 🛠️ Build

### Prérequis
- `sui` CLI installée

### Build
```bash
sui move build
```

### Tests
```bash
sui move test
```

---

## 🚀 Idées futures
- Reposts / quote-posts
- Système de badges on-chain
- API indexer pour feed et explore
- Modération basique

---

## 📜 Disclaimer
Ce projet est une **preuve de concept éducative**.  
Ne pas utiliser tel quel en production sans audit de sécurité.

