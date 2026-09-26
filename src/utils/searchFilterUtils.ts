import { Post, Story, DateRangeFilter, SearchFilterState, PopularitySortFilter } from "../types";

/**
 * Calculates a dynamic Popularity Score for a Post based on engagement,
 * algorithmic boosts, creator credibility, and temporal recency.
 */
export function calculatePostPopularityScore(post: Post): number {
  let score = 0;

  // Engagement weights
  const likesCount = Array.isArray(post.likes) ? post.likes.length : 0;
  const commentsCount = Array.isArray(post.comments) ? post.comments.length : 0;
  const savedCount = Array.isArray(post.savedBy) ? post.savedBy.length : 0;

  score += likesCount * 3;
  score += commentsCount * 4;
  score += savedCount * 5;

  // Boost bonus (sponsored/promoted posts get high reach score)
  if (post.isBoosted) {
    score += 50;
  }

  // Official verified creator bonus
  if (post.isVerified) {
    score += 20;
  }

  // Recency bonus: Fresh content within 24h or 7 days gets trending momentum
  try {
    const postTime = new Date(post.createdAt).getTime();
    if (!isNaN(postTime)) {
      const diffHours = (Date.now() - postTime) / (1000 * 60 * 60);
      if (diffHours >= 0 && diffHours <= 24) {
        score += 35; // Fresh viral momentum
      } else if (diffHours > 24 && diffHours <= 168) {
        score += 20; // 7 days trending momentum
      } else if (diffHours > 168 && diffHours <= 720) {
        score += 10; // 30 days active momentum
      }
    }
  } catch {
    // ignore parse error
  }

  return score;
}

/**
 * Calculates a dynamic Popularity Score for a Story (Jhalak)
 */
export function calculateStoryPopularityScore(story: Story): number {
  let score = 0;

  const likesCount = Array.isArray(story.likes) ? story.likes.length : 0;
  const viewsCount = Array.isArray(story.viewedBy) ? story.viewedBy.length : 0;

  score += likesCount * 4;
  score += viewsCount * 2;

  // Recency bonus: Stories are naturally fast-paced 24h content
  try {
    const storyTime = new Date(story.createdAt).getTime();
    if (!isNaN(storyTime)) {
      const diffHours = (Date.now() - storyTime) / (1000 * 60 * 60);
      if (diffHours >= 0 && diffHours <= 12) {
        score += 30;
      } else if (diffHours > 12 && diffHours <= 24) {
        score += 15;
      }
    }
  } catch {
    // ignore parse error
  }

  return score;
}

/**
 * Checks whether an ISO date string falls within the specified DateRangeFilter
 */
export function isDateWithinRange(dateStr: string, range: DateRangeFilter): boolean {
  if (range === "all") return true;

  try {
    const itemTime = new Date(dateStr).getTime();
    if (isNaN(itemTime)) return true; // keep if timestamp missing

    const now = Date.now();
    const diffMs = now - itemTime;
    const diffHours = diffMs / (1000 * 60 * 60);

    switch (range) {
      case "today":
        return diffHours >= 0 && diffHours <= 24;
      case "week":
        return diffHours >= 0 && diffHours <= 24 * 7;
      case "month":
        return diffHours >= 0 && diffHours <= 24 * 30;
      case "year":
        return diffHours >= 0 && diffHours <= 24 * 365;
      default:
        return true;
    }
  } catch {
    return true;
  }
}

/**
 * Matches query against text fields with support for English and Devanagari script
 */
export function matchesQuery(query: string, ...fields: (string | undefined | null)[]): boolean {
  if (!query || !query.trim()) return true;
  const cleanQ = query.trim().toLowerCase();

  return fields.some((field) => {
    if (!field) return false;
    return field.toLowerCase().includes(cleanQ);
  });
}

export interface RankedPost {
  post: Post;
  popularityScore: number;
}

export interface RankedStory {
  story: Story;
  popularityScore: number;
}

/**
 * Filters and ranks posts according to full SearchFilterState criteria
 */
export function filterAndRankPosts(
  posts: Post[],
  filters: SearchFilterState
): RankedPost[] {
  // If user strictly requested stories only, return empty posts
  if (filters.mediaType === "stories") {
    return [];
  }

  const query = filters.query.trim().toLowerCase();

  const filtered = posts.filter((post) => {
    // 1. Text Query Filter
    if (query) {
      const matchText =
        matchesQuery(query, post.caption, post.nepaliCaption, post.location, post.district, post.city, post.username, post.userFullName) ||
        (Array.isArray(post.tags) && post.tags.some((t) => t.toLowerCase().includes(query)));

      if (!matchText) return false;
    }

    // 2. Date Range Filter
    if (!isDateWithinRange(post.createdAt, filters.dateRange)) {
      return false;
    }

    // 3. Minimum Popularity Score Threshold
    const score = calculatePostPopularityScore(post);
    if (filters.minPopularityScore > 0 && score < filters.minPopularityScore) {
      return false;
    }

    return true;
  });

  // Calculate scores and sort
  const scoredPosts: RankedPost[] = filtered.map((post) => ({
    post,
    popularityScore: calculatePostPopularityScore(post),
  }));

  // Sort by requested criterion
  scoredPosts.sort((a, b) => {
    switch (filters.sortBy) {
      case "trending":
        return b.popularityScore - a.popularityScore;
      case "most_liked": {
        const aLikes = Array.isArray(a.post.likes) ? a.post.likes.length : 0;
        const bLikes = Array.isArray(b.post.likes) ? b.post.likes.length : 0;
        return bLikes - aLikes;
      }
      case "most_discussed": {
        const aComments = Array.isArray(a.post.comments) ? a.post.comments.length : 0;
        const bComments = Array.isArray(b.post.comments) ? b.post.comments.length : 0;
        return bComments - aComments;
      }
      case "latest":
        return new Date(b.post.createdAt).getTime() - new Date(a.post.createdAt).getTime();
      case "oldest":
        return new Date(a.post.createdAt).getTime() - new Date(b.post.createdAt).getTime();
      default:
        return b.popularityScore - a.popularityScore;
    }
  });

  return scoredPosts;
}

/**
 * Filters and ranks stories according to full SearchFilterState criteria
 */
export function filterAndRankStories(
  stories: Story[],
  filters: SearchFilterState
): RankedStory[] {
  // If user strictly requested images only, return empty stories
  if (filters.mediaType === "images") {
    return [];
  }

  const query = filters.query.trim().toLowerCase();

  const filtered = stories.filter((story) => {
    // 1. Text Query Filter
    if (query) {
      const matchText = matchesQuery(
        query,
        story.caption,
        story.location,
        story.username
      );
      if (!matchText) return false;
    }

    // 2. Date Range Filter
    if (!isDateWithinRange(story.createdAt, filters.dateRange)) {
      return false;
    }

    // 3. Minimum Popularity Score Threshold
    const score = calculateStoryPopularityScore(story);
    if (filters.minPopularityScore > 0 && score < filters.minPopularityScore) {
      return false;
    }

    return true;
  });

  const scoredStories: RankedStory[] = filtered.map((story) => ({
    story,
    popularityScore: calculateStoryPopularityScore(story),
  }));

  scoredStories.sort((a, b) => {
    switch (filters.sortBy) {
      case "trending":
        return b.popularityScore - a.popularityScore;
      case "most_liked": {
        const aLikes = Array.isArray(a.story.likes) ? a.story.likes.length : 0;
        const bLikes = Array.isArray(b.story.likes) ? b.story.likes.length : 0;
        return bLikes - aLikes;
      }
      case "most_discussed": // For stories, viewedBy acts as engagement proxy
      {
        const aViews = Array.isArray(a.story.viewedBy) ? a.story.viewedBy.length : 0;
        const bViews = Array.isArray(b.story.viewedBy) ? b.story.viewedBy.length : 0;
        return bViews - aViews;
      }
      case "latest":
        return new Date(b.story.createdAt).getTime() - new Date(a.story.createdAt).getTime();
      case "oldest":
        return new Date(a.story.createdAt).getTime() - new Date(b.story.createdAt).getTime();
      default:
        return b.popularityScore - a.popularityScore;
    }
  });

  return scoredStories;
}
