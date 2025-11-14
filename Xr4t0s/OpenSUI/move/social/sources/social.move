module social::social {
    use std::string::{Self as string, String};
    use sui::table::{Self as table, Table};
    use sui::event;
    use sui::clock::Clock;
	
    use social::utils;

	/*-------------------------------------------------------------------------------
		Objets possédés par les utilisateurs (owned objects)							|
		- Profile																	|
		- Post																		|
		- Like																		|
		- Follow																	|
		- Comment																	|
																					|
		Chaque interaction des utilisateurs crée, met à jour ou détruit un de ces	|
		objets.																		|
	-------------------------------------------------------------------------------*/

    /// Profil utilisateur de base sur le réseau social.
    public struct Profile has key, store {
        id: UID,

		/*
			owner:			adresse du propriétaire du profil (wallet)
			username: 		nom d’affichage du profil
			description:	bio / texte de présentation
			avatar_url:		URL (pour l'instant ipfs://...) de l’avatar
			followers: 		(placeholder) liste d’adresses qui suivent ce profil
			followed: 		liste d’adresses de profils suivis par ce profil
		*/
        owner: address,
        username: String,
        description: String,
        avatar_url: String,
        followers: vector<address>,
        followed: vector<address>,
    }

    /// NFT de follow : prouve qu’un profil A suit un profil B.
    public struct Follow has key, store {
        id: UID,

		/*
			follower:				adresse du follower (propriétaire du NFT)
			followed_profile_id:	adresse de l’objet Profile suivi
		*/
        follower: address,
        followed_profile_id: address,
    }

    /// Post simple publié par un profil.
    public struct Post has key, store {
        id: UID,

		/*
			author_profile_id:	adresse de l’objet Profile auteur du post
			author:				adresse de l’owner de ce profil (wallet auteur)
			content: 			contenu texte du post
			created_ms: 		timestamp de création (millisecondes)
			updated_ms: 		dernier timestamp de modification
		*/
        author_profile_id: address,
        author: address,
        content: String,
        created_ms: u64,
        updated_ms: u64,
    }

    /// NFT de like : prouve qu’un profil a liké un post.
    public struct Like has key, store {
        id: UID,

		/*
			post_id:			adresse de l’objet Post liké
			liker_profile_id:	adresse de l’objet Profile du liker
			liker:				adresse de l’owner (wallet) du liker
		*/
        post_id: address,
        liker_profile_id: address,
        liker: address,
    }

	/// Commentaire attaché à un post.
	public struct Comment has key, store {
        id: UID,

		/*
			post_id:			adresse de l’objet Post concerné
			author_profile_id:	adresse de l’objet Profile qui commente
			author:				adresse de l’owner (wallet) du commentateur
			content:			contenu texte du commentaire
			created_ms:			timestamp de création (millisecondes)
			updated_ms:			dernier timestamp de modification
		*/
        post_id: address,
        author_profile_id: address,
        author: address,
        content: String,
        created_ms: u64,
        updated_ms: u64,
    }


	/*-------------------------------------------------------------------------------
		Objets partagés (shared objects) utilisés comme registres globaux			|
		- Registre des profils														|
		- Registre des followers													|
		- Registre des posts														|
		- Registre des likes														|
		- Registre des commentaires													|
																					|
		Ces objets sont partagés sur le réseau et servent d’index / compteur global.|
	-------------------------------------------------------------------------------*/

    /// Registre global des profils : liste et mapping owner → profile_id.
    public struct ProfilesRegistry has key {
		/*
			profiles:	liste de toutes les adresses de profils créés
			owners:		mapping adresse d’owner (wallet) -> adresse de Profile
		*/
		id: UID,
        profiles: vector<address>,
        owners: Table<address, address>,
    }

    /// Registre global des followers (compteur de followers par profil).
    public struct FollowersRegistry has key {
		/*
			counts[profile_id]: nombre de followers pour ce profil
		*/
        id: UID,
        counts: Table<address, u64>,
    }

    /// Registre global des posts, indexés par profil.
    public struct PostsRegistry has key {
		/*
			posts_of[profile_id]:	vector des adresses des posts de ce profil
			posts_count[profile_id]: compteur total de posts de ce profil
		*/
        id: UID,
        posts_of: Table<address, vector<address>>,
        posts_count: Table<address, u64>,
    }

    /// Clé logique (post, liker) pour indexer un like unique.
    public struct LikeKey has copy, drop, store {
		/*
			post:	adresse de l’objet Post liké
			liker:	adresse du wallet qui like
		*/
        post: address,
        liker: address,
    }

    /// Registre global des likes (compteurs + index pour éviter les doublons).
    public struct LikesRegistry has key {
		/*
			counts[post_id]:			nombre total de likes sur ce post
			index[LikeKey]:			adresse de l’objet Like correspondant
		*/
        id: UID,
        counts: Table<address, u64>,
        index:  Table<LikeKey, address>,
    }

    /// Registre global des commentaires, indexés par post.
    public struct CommentsRegistry has key {
		/*
			comments_of[post_id]:	vector des adresses de Comment attachés à ce post
			counts[post_id]:		nombre total de commentaires sur ce post
		*/
        id: UID,
        comments_of: Table<address, vector<address>>,
        counts:     Table<address, u64>,
    }
	

    /* ---------------------------- EVENTS ---------------------------- */

	/// Émis lors de la création d’un profil utilisateur.
    public struct ProfileCreated has copy, drop, store { profile_id: address, owner: address }

	/// Émis lors d’une mise à jour de l’avatar d’un profil.
    public struct AvatarUpdated  has copy, drop, store { profile_id: address }

	/// Émis lorsqu’un profil commence à en suivre un autre.
    public struct Followed has copy, drop, store {
        follower_profile_id: address,
        followed_profile_id: address
    }

	/// Émis lorsqu’un profil arrête de suivre un autre.
    public struct Unfollowed has copy, drop, store {
        follower_profile_id: address,
        followed_profile_id: address
    }

	/// Émis lorsqu’un post est publié.
    public struct PostPublished has copy, drop, store {
        post_id: address,
        author_profile_id: address
    }

	/// Émis lorsqu’un post est édité.
    public struct PostEdited has copy, drop, store {
        post_id: address
    }

	/// Émis lorsqu’un post est supprimé.
    public struct PostDeleted has copy, drop, store {
        post_id: address,
        author_profile_id: address
    }

	/// Émis lorsqu’un post est liké.
    public struct Liked has copy, drop, store {
        post_id: address,
        liker_profile_id: address,
        like_nft_id: address
    }

	/// Émis lorsqu’un like est retiré.
    public struct Unliked has copy, drop, store {
        post_id: address,
        liker_profile_id: address,
        like_nft_id: address
    }

	/// Émis lorsqu’un commentaire est ajouté à un post.
    public struct CommentAdded has copy, drop, store {
        post_id: address,
        comment_id: address,
        author_profile_id: address
    }

	/// Émis lorsqu’un commentaire est supprimé d’un post.
    public struct CommentDeleted has copy, drop, store {
        post_id: address,
        comment_id: address,
        author_profile_id: address
    }


    /// Initialise le protocole : crée et partage tous les registres globaux.
    fun init(ctx: &mut TxContext) {
		// Registre global des profils
        let registry_profiles = ProfilesRegistry {
            id: object::new(ctx),
            profiles: vector::empty<address>(),
            owners: table::new(ctx),
        };
        transfer::share_object(registry_profiles);

		// Registre global des followers (compteurs par profil)
        let registry_followers = FollowersRegistry {
            id: object::new(ctx),
            counts: table::new(ctx),
        };
        transfer::share_object(registry_followers);

		// Registre global des posts (index par profil + compteur)
        let registry_posts = PostsRegistry {
            id: object::new(ctx),
            posts_of: table::new(ctx),
            posts_count: table::new(ctx),
        };
        transfer::share_object(registry_posts);

		// Registre global des likes (compteurs + index LikeKey → Like)
        let registry_likes = LikesRegistry {
            id: object::new(ctx),
            counts: table::new(ctx),
            index:  table::new(ctx),
        };
        transfer::share_object(registry_likes);

		// Registre global des commentaires (index par post + compteur)
        let registry_comments = CommentsRegistry {
            id: object::new(ctx),
            counts: table::new(ctx),
            comments_of: table::new(ctx),
        };
        transfer::share_object(registry_comments);
    }


	#[allow(lint(self_transfer))]
    public fun create_profile(
        profiles: &mut ProfilesRegistry,
        username: String,
        description: String,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(!table::contains(&profiles.owners, sender), 100);

        let profile = Profile {
            id: object::new(ctx),
            owner: sender,
            username,
            description,
            avatar_url: string::utf8(b""),
            followers: vector::empty<address>(),
            followed: vector::empty<address>(),
        };

        let pid = object::uid_to_address(&profile.id);
        vector::push_back(&mut profiles.profiles, pid);
        table::add(&mut profiles.owners, sender, pid);
        event::emit(ProfileCreated { profile_id: pid, owner: sender });

        transfer::transfer(profile, sender);
    }
	#[allow(lint(self_transfer))]
    public fun create_profile_with_avatar(
        profiles: &mut ProfilesRegistry,
        username: String,
        description: String,
        avatar_url: String,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(!table::contains(&profiles.owners, sender), 100);

        let profile = Profile {
            id: object::new(ctx),
            owner: sender,
            username,
            description,
            avatar_url,
            followers: vector::empty<address>(),
            followed: vector::empty<address>(),
        };

        let pid = object::uid_to_address(&profile.id);
        vector::push_back(&mut profiles.profiles, pid);
        table::add(&mut profiles.owners, sender, pid);
        event::emit(ProfileCreated { profile_id: pid, owner: sender });

        transfer::transfer(profile, sender);
    }

    public fun set_avatar_url(p: &mut Profile, new_url: String, _ctx: &mut TxContext) {
        let sender = p.owner;
        assert!(p.owner == sender, 101);
        p.avatar_url = new_url;
        let pid = object::uid_to_address(&p.id);
        event::emit(AvatarUpdated { profile_id: pid });
    }

	#[allow(lint(self_transfer))]
    public fun follow(
        reg: &mut FollowersRegistry,
        follower_profile: &mut Profile,
        followed_profile_id: address,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(follower_profile.owner == sender, 0);
        let my_profile_id = object::uid_to_address(&follower_profile.id);
        assert!(my_profile_id != followed_profile_id, 1);
        assert!(!utils::contains_addr(&follower_profile.followed, followed_profile_id), 2);

        vector::push_back(&mut follower_profile.followed, followed_profile_id);

        if (table::contains(&reg.counts, followed_profile_id)) {
            let c = table::borrow_mut(&mut reg.counts, followed_profile_id);
            *c = *c + 1;
        } else {
            table::add(&mut reg.counts, followed_profile_id, 1);
        };

        let nft = Follow { id: object::new(ctx), follower: sender, followed_profile_id };
        event::emit(Followed { follower_profile_id: my_profile_id, followed_profile_id });
        transfer::transfer(nft, sender);
    }

    public fun unfollow(
        reg: &mut FollowersRegistry,
        follower_profile: &mut Profile,
        nft: Follow,
        _ctx: &mut TxContext
    ) {
        let sender = follower_profile.owner;
        assert!(nft.follower == sender, 10);

        utils::remove_first_addr(&mut follower_profile.followed, nft.followed_profile_id);

        if (table::contains(&reg.counts, nft.followed_profile_id)) {
            let c = table::borrow_mut(&mut reg.counts, nft.followed_profile_id);
            if (*c > 1) { *c = *c - 1; } else { table::remove(&mut reg.counts, nft.followed_profile_id); }
        };

        let pid = object::uid_to_address(&follower_profile.id);
        event::emit(Unfollowed { follower_profile_id: pid, followed_profile_id: nft.followed_profile_id });

        let Follow { id, follower: _, followed_profile_id: _ } = nft;
        object::delete(id);
    }

	#[allow(lint(self_transfer))]
    public fun publish_post(
        posts: &mut PostsRegistry,
        author_profile: &mut Profile,
        content: String,
		clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(author_profile.owner == sender, 20);

        let now = clock.timestamp_ms();
        let pid = object::uid_to_address(&author_profile.id);

        let post = Post {
            id: object::new(ctx),
            author_profile_id: pid,
            author: sender,
            content,
            created_ms: now,
            updated_ms: now,
        };

        let post_id = object::uid_to_address(&post.id);
        if (table::contains(&posts.posts_of, pid)) {
            let v = table::borrow_mut(&mut posts.posts_of, pid);
            vector::push_back(v, post_id);
        } else {
            let mut v = vector::empty<address>();
            vector::push_back(&mut v, post_id);
            table::add(&mut posts.posts_of, pid, v);
        };

        if (table::contains(&posts.posts_count, pid)) {
            let c = table::borrow_mut(&mut posts.posts_count, pid);
            *c = *c + 1;
        } else {
            table::add(&mut posts.posts_count, pid, 1);
        };

        event::emit(PostPublished { post_id, author_profile_id: pid });
        transfer::transfer(post, sender);
    }

    public fun edit_post(
        author_profile: &mut Profile,
        post: &mut Post,
        new_content: String,
		clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(author_profile.owner == sender, 21);
        let pid = object::uid_to_address(&author_profile.id);
        assert!(post.author_profile_id == pid, 22);
        assert!(post.author == sender, 23);

        post.content = new_content;
        post.updated_ms = clock.timestamp_ms();
        event::emit(PostEdited { post_id: object::uid_to_address(&post.id) });
    }

    public fun delete_post(
        posts: &mut PostsRegistry,
        author_profile: &mut Profile,
        post: Post
    ) {
        let sender = author_profile.owner;
        let Post { id, author_profile_id, author, content: _, created_ms: _, updated_ms: _ } = post;

        assert!(author == sender, 24);
        let pid = object::uid_to_address(&author_profile.id);
        assert!(author_profile_id == pid, 25);

        if (table::contains(&posts.posts_of, pid)) {
            let v = table::borrow_mut(&mut posts.posts_of, pid);
            let post_id = object::uid_to_address(&id);
            utils::remove_first_addr(v, post_id);
        };

        if (table::contains(&posts.posts_count, pid)) {
            let c = table::borrow_mut(&mut posts.posts_count, pid);
            if (*c > 0) { *c = *c - 1; }
        };

        let post_id = object::uid_to_address(&id);
        event::emit(PostDeleted { post_id, author_profile_id: pid });
        object::delete(id);
    }

	#[allow(lint(self_transfer))]
    public fun like_post(
		likes: &mut LikesRegistry,
		liker_profile: &mut Profile,
		post_id: address,
		ctx: &mut TxContext
	) {
		let sender = tx_context::sender(ctx);
		assert!(liker_profile.owner == sender, 30);

		let key = LikeKey { post: post_id, liker: sender };

		assert!(!table::contains(&likes.index, key), 31);

		let pid = object::uid_to_address(&liker_profile.id);
		let like = Like {
			id: object::new(ctx),
			post_id,
			liker_profile_id: pid,
			liker: sender
		};
		let like_id = object::uid_to_address(&like.id);

		if (table::contains(&likes.counts, post_id)) {
			let c = table::borrow_mut(&mut likes.counts, post_id);
			*c = *c + 1;
		} else {
			table::add(&mut likes.counts, post_id, 1);
		};

		table::add(&mut likes.index, key, like_id);

		event::emit(Liked { post_id, liker_profile_id: pid, like_nft_id: like_id });
		transfer::transfer(like, sender);
	}


    public fun unlike_post(
        likes: &mut LikesRegistry,
        liker_profile: &mut Profile,
        like_nft: Like
    ) {
        let sender = liker_profile.owner;
        assert!(like_nft.liker == sender, 32);

        let key = LikeKey { post: like_nft.post_id, liker: sender };
        assert!(table::contains(&likes.index, key), 33);
        let stored = table::borrow(&likes.index, key);
        assert!(*stored == object::uid_to_address(&like_nft.id), 34);

        if (table::contains(&likes.counts, like_nft.post_id)) {
            let c = table::borrow_mut(&mut likes.counts, like_nft.post_id);
            if (*c > 0) { *c = *c - 1; }
        };
        table::remove(&mut likes.index, key);

        event::emit(Unliked {
            post_id: like_nft.post_id,
            liker_profile_id: like_nft.liker_profile_id,
            like_nft_id: object::uid_to_address(&like_nft.id)
        });

        let Like { id, post_id: _, liker_profile_id: _, liker: _ } = like_nft;
        object::delete(id);
    }

	#[allow(lint(self_transfer))]
    public fun add_comment(
		comments: &mut CommentsRegistry,
		author_profile: &mut Profile,
		post_id: address,
		content: String,
		clock: &Clock,
		ctx: &mut TxContext
	) {
		let sender = tx_context::sender(ctx);
		assert!(author_profile.owner == sender, 40);

		let now = clock.timestamp_ms();
		let pid = object::uid_to_address(&author_profile.id);

		let c = Comment {
			id: object::new(ctx),
			post_id,
			author_profile_id: pid,
			author: sender,
			content,
			created_ms: now,
			updated_ms: now,
		};
		let cid = object::uid_to_address(&c.id);

		if (table::contains(&comments.comments_of, post_id)) {
			let v = table::borrow_mut(&mut comments.comments_of, post_id);
			vector::push_back(v, cid);
		} else {
			let mut v = vector::empty<address>();
			vector::push_back(&mut v, cid);
			table::add(&mut comments.comments_of, post_id, v);
		};

		if (table::contains(&comments.counts, post_id)) {
			let n = table::borrow_mut(&mut comments.counts, post_id);
			*n = *n + 1;
		} else {
			table::add(&mut comments.counts, post_id, 1);
		};

		event::emit(CommentAdded { post_id, comment_id: cid, author_profile_id: pid });
		transfer::transfer(c, sender);
	}

    public fun edit_comment(
        author_profile: &mut Profile,
        comment: &mut Comment,
        new_content: String,
		clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(author_profile.owner == sender, 41);
        let pid = object::uid_to_address(&author_profile.id);
        assert!(comment.author_profile_id == pid, 42);
        assert!(comment.author == sender, 43);

        comment.content = new_content;
        comment.updated_ms = clock.timestamp_ms();
    }

    public fun delete_comment(
        comments: &mut CommentsRegistry,
        author_profile: &mut Profile,
        comment: Comment
    ) {
        let sender = author_profile.owner;
        let Comment { id, post_id, author_profile_id, author, content: _, created_ms: _, updated_ms: _ } = comment;

        let pid = object::uid_to_address(&author_profile.id);
        assert!(author == sender, 44);
        assert!(author_profile_id == pid, 45);

        if (table::contains(&comments.comments_of, post_id)) {
            let v = table::borrow_mut(&mut comments.comments_of, post_id);
            let cid = object::uid_to_address(&id);
            utils::remove_first_addr(v, cid);
        };

        if (table::contains(&comments.counts, post_id)) {
            let n = table::borrow_mut(&mut comments.counts, post_id);
            if (*n > 0) { *n = *n - 1; }
        };

        event::emit(CommentDeleted { post_id, comment_id: object::uid_to_address(&id), author_profile_id });
        object::delete(id);
    }


    public fun is_following(p: &Profile, who: address): bool { utils::contains_addr(&p.followed, who) }

    public fun followers_count(reg: &FollowersRegistry, profile_id: address): u64 {
        if (table::contains(&reg.counts, profile_id)) { *table::borrow(&reg.counts, profile_id) } else { 0 }
    }

    public fun followed_count_local(p: &Profile): u64 { vector::length(&p.followed) }

    public fun likes_count(reg: &LikesRegistry, post_id: address): u64 {
        if (table::contains(&reg.counts, post_id)) { *table::borrow(&reg.counts, post_id) } else { 0 }
    }

    public fun comments_count(reg: &CommentsRegistry, post_id: address): u64 {
        if (table::contains(&reg.counts, post_id)) { *table::borrow(&reg.counts, post_id) } else { 0 }
    }

    public fun posts_count(reg: &PostsRegistry, profile_id: address): u64 {
        if (table::contains(&reg.posts_count, profile_id)) { *table::borrow(&reg.posts_count, profile_id) } else { 0 }
    }
}
