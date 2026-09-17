import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  orderBy,
  limit,
  onSnapshot,
  deleteDoc,
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { Post, User } from "../types";

export const firestoreSync = {
  // Sync a newly created post to Firestore
  async createPost(post: Post): Promise<void> {
    const path = `posts/${post.id}`;
    try {
      await setDoc(doc(db, "posts", post.id), {
        id: post.id,
        userId: post.userId,
        username: post.username,
        userAvatar: post.userAvatar || "",
        imageUrl: post.imageUrl,
        caption: post.caption || "",
        location: post.location || "",
        district: post.district || "",
        category: post.category || "lifestyle",
        likes: Array.isArray(post.likes) ? post.likes.length : 0,
        commentsCount: Array.isArray(post.comments) ? post.comments.length : 0,
        createdAt: post.createdAt || new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Sync user profile to Firestore
  async saveUser(user: User): Promise<void> {
    const path = `users/${user.id}`;
    try {
      await setDoc(
        doc(db, "users", user.id),
        {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          nepaliName: user.nepaliName || "",
          avatar: user.avatar || "",
          bio: user.bio || "",
          location: user.location || "",
          district: user.district || "Kathmandu",
          followersCount: user.followersCount || 0,
          followingCount: user.followingCount || 0,
          postsCount: user.postsCount || 0,
          isVerified: !!user.isVerified,
          isEmailVerified: !!user.isEmailVerified,
          accountType: user.accountType || "personal",
          role: user.role || "user",
          createdAt: user.createdAt || new Date().toISOString(),
          email: user.email || "",
        },
        { merge: true }
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Save like to Firestore
  async setLike(postId: string, userId: string, liked: boolean): Promise<void> {
    const path = `posts/${postId}/likes/${userId}`;
    try {
      if (liked) {
        await setDoc(doc(db, "posts", postId, "likes", userId), {
          userId,
          postId,
          createdAt: new Date().toISOString(),
        });
      } else {
        await deleteDoc(doc(db, "posts", postId, "likes", userId));
      }
    } catch (error) {
      handleFirestoreError(error, liked ? OperationType.CREATE : OperationType.DELETE, path);
    }
  },

  // Fetch recent posts from Firestore
  async fetchRecentPosts(maxCount = 20): Promise<Post[]> {
    const path = "posts";
    try {
      const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(maxCount));
      const snapshot = await getDocs(q);
      const posts: Post[] = [];
      snapshot.forEach((docSnap) => {
        posts.push(docSnap.data() as Post);
      });
      return posts;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  // Real-time listener for Firestore posts
  subscribePosts(callback: (posts: Post[]) => void): () => void {
    const path = "posts";
    try {
      const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(25));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const posts: Post[] = [];
          snapshot.forEach((docSnap) => {
            posts.push(docSnap.data() as Post);
          });
          callback(posts);
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, path);
        }
      );
      return unsubscribe;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return () => {};
    }
  },
};
