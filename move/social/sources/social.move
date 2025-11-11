module social::social {
    use std::string::{Self as string, String};
    use sui::table::{Self as table, Table};
    use sui::event;
	use sui::clock::Clock;

    public struct Profiles has key {
        id: UID,
        profiles: vector<address>,
        owners: Table<address, address>,
    }

    public struct Profile has key, store {
        id: UID,
        owner: address,
        username: String,
        description: String,
        avatar_url: String,
        followers: vector<address>,
        followed: vector<address>,
    }

    public struct FollowNFT has key, store {
        id: UID,
        follower: address,
        followed_profile_id: address,
    }

    public struct FollowersRegistry has key {
        id: UID,
        counts: Table<address, u64>,
    }

    public struct PostsRegistry has key {
        id: UID,
        posts_of: Table<address, vector<address>>,
        posts_count: Table<address, u64>,
    }

    public struct Post has key, store {
        id: UID,
        author_profile_id: address,
        author: address,
        content: String,
        created_ms: u64,
        updated_ms: u64,
    }

    public struct LikeNFT has key, store {
        id: UID,
        post_id: address,
        liker_profile_id: address,
        liker: address,
    }

    public struct LikeKey has copy, drop, store {
        post: address,
        liker: address,
    }

    public struct LikesRegistry has key {
        id: UID,
        counts: Table<address, u64>,
        index:  Table<LikeKey, address>,
    }

    public struct Comment has key, store {
        id: UID,
        post_id: address,
        author_profile_id: address,
        author: address,
        content: String,
        created_ms: u64,
        updated_ms: u64,
    }

    public struct CommentsRegistry has key {
        id: UID,
        counts:     Table<address, u64>,
        comments_of: Table<address, vector<address>>,
    }

    /* ---------------------------- EVENTS ---------------------------- */

    public struct ProfileCreated has copy, drop, store { profile_id: address, owner: address }
    public struct AvatarUpdated  has copy, drop, store { profile_id: address }
    public struct Followed       has copy, drop, store { follower_profile_id: address, followed_profile_id: address }
    public struct Unfollowed     has copy, drop, store { follower_profile_id: address, followed_profile_id: address }

    public struct PostPublished  has copy, drop, store { post_id: address, author_profile_id: address }
    public struct PostEdited     has copy, drop, store { post_id: address }
    public struct PostDeleted    has copy, drop, store { post_id: address, author_profile_id: address }

    public struct Liked          has copy, drop, store { post_id: address, liker_profile_id: address, like_nft_id: address }
    public struct Unliked        has copy, drop, store { post_id: address, liker_profile_id: address, like_nft_id: address }

    public struct CommentAdded   has copy, drop, store { post_id: address, comment_id: address, author_profile_id: address }
    public struct CommentDeleted has copy, drop, store { post_id: address, comment_id: address, author_profile_id: address }


    fun contains(addr_list: &vector<address>, a: address): bool {
        let n = vector::length(addr_list);
        let mut i = 0;
        while (i < n) {
            if (vector::borrow(addr_list, i) == &a) return true;
            i = i + 1;
        };
        false
    }

    fun remove_first(addr_list: &mut vector<address>, a: address) {
        let n = vector::length(addr_list);
        let mut i = 0;
        while (i < n) {
            if (vector::borrow(addr_list, i) == &a) {
                let last = n - 1;
                vector::swap(addr_list, i, last);
                vector::pop_back(addr_list);
                return
            };
            i = i + 1;
        }
    }


    fun init(ctx: &mut TxContext) {
        let registry_profiles = Profiles {
            id: object::new(ctx),
            profiles: vector::empty<address>(),
            owners: table::new(ctx),
        };
        transfer::share_object(registry_profiles);

        let registry_followers = FollowersRegistry {
            id: object::new(ctx),
            counts: table::new(ctx),
        };
        transfer::share_object(registry_followers);

        let registry_posts = PostsRegistry {
            id: object::new(ctx),
            posts_of: table::new(ctx),
            posts_count: table::new(ctx),
        };
        transfer::share_object(registry_posts);

        let registry_likes = LikesRegistry {
            id: object::new(ctx),
            counts: table::new(ctx),
            index:  table::new(ctx),
        };
        transfer::share_object(registry_likes);

        let registry_comments = CommentsRegistry {
            id: object::new(ctx),
            counts: table::new(ctx),
            comments_of: table::new(ctx),
        };
        transfer::share_object(registry_comments);
    }

	#[allow(lint(self_transfer))]
    public fun create_profile(
        profiles: &mut Profiles,
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
        profiles: &mut Profiles,
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
        assert!(!contains(&follower_profile.followed, followed_profile_id), 2);

        vector::push_back(&mut follower_profile.followed, followed_profile_id);

        if (table::contains(&reg.counts, followed_profile_id)) {
            let c = table::borrow_mut(&mut reg.counts, followed_profile_id);
            *c = *c + 1;
        } else {
            table::add(&mut reg.counts, followed_profile_id, 1);
        };

        let nft = FollowNFT { id: object::new(ctx), follower: sender, followed_profile_id };
        event::emit(Followed { follower_profile_id: my_profile_id, followed_profile_id });
        transfer::transfer(nft, sender);
    }

    public fun unfollow(
        reg: &mut FollowersRegistry,
        follower_profile: &mut Profile,
        nft: FollowNFT,
        _ctx: &mut TxContext
    ) {
        let sender = follower_profile.owner;
        assert!(nft.follower == sender, 10);

        remove_first(&mut follower_profile.followed, nft.followed_profile_id);

        if (table::contains(&reg.counts, nft.followed_profile_id)) {
            let c = table::borrow_mut(&mut reg.counts, nft.followed_profile_id);
            if (*c > 1) { *c = *c - 1; } else { table::remove(&mut reg.counts, nft.followed_profile_id); }
        };

        let pid = object::uid_to_address(&follower_profile.id);
        event::emit(Unfollowed { follower_profile_id: pid, followed_profile_id: nft.followed_profile_id });

        let FollowNFT { id, follower: _, followed_profile_id: _ } = nft;
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
            remove_first(v, post_id);
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
		let like = LikeNFT {
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
        like_nft: LikeNFT
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

        let LikeNFT { id, post_id: _, liker_profile_id: _, liker: _ } = like_nft;
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
            remove_first(v, cid);
        };

        if (table::contains(&comments.counts, post_id)) {
            let n = table::borrow_mut(&mut comments.counts, post_id);
            if (*n > 0) { *n = *n - 1; }
        };

        event::emit(CommentDeleted { post_id, comment_id: object::uid_to_address(&id), author_profile_id });
        object::delete(id);
    }


    public fun is_following(p: &Profile, who: address): bool { contains(&p.followed, who) }

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
