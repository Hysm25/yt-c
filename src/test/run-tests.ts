import { repository } from "../services/db/repository";
import { youtubeService } from "../services/youtube/service-factory";
import {
  formatDuration,
  parseIsoDuration,
  formatViewCount,
  formatSubscriberCount,
  formatRelativeTime,
} from "../lib/utils";

async function runTestSuite() {
  console.log("=== STARTING FULL TEST SUITE ===");

  // 1. Utility Tests
  console.log("\n[1/3] Testing Utility Functions...");
  if (formatDuration(65) !== "1:05") throw new Error("formatDuration failed");
  if (formatDuration(3665) !== "1:01:05") throw new Error("formatDuration hours failed");
  if (parseIsoDuration("PT4M13S") !== 253) throw new Error("parseIsoDuration failed");
  if (formatViewCount(1500000) !== "1.5M views") throw new Error("formatViewCount failed");
  if (formatSubscriberCount(2400000) !== "2.4M subscribers") throw new Error("formatSubscriberCount failed");
  console.log("✓ Utilities verified successfully");

  // 2. Repository Tests
  console.log("\n[2/3] Testing Database Repository...");
  const testUserId = `test-user-${Date.now()}`;
  
  // Settings
  const settings = await repository.getUserSettings(testUserId);
  if (!settings.defaultPlaybackProvider) throw new Error("Settings fetch failed");
  console.log("✓ User settings verified");

  // Watch History
  await repository.upsertWatchProgress({
    userId: testUserId,
    videoId: "test-v1",
    title: "Test Video 1",
    channelTitle: "Test Channel",
    progressSeconds: 50,
    totalSeconds: 200,
  });
  const history = await repository.getWatchHistory(testUserId);
  if (history.length === 0 || history[0].progressSeconds !== 50) {
    throw new Error("Watch history upsert failed");
  }
  console.log("✓ Watch history verified");

  // Playlists & Cascade Deletion
  const playlist = await repository.createPlaylist(testUserId, "My Playlist", "Description");
  await repository.addPlaylistItem(playlist.id, {
    videoId: "test-v1",
    title: "Item 1",
    channelTitle: "Test Channel",
  });
  const plWithItems = await repository.getPlaylistWithItems(playlist.id);
  if (!plWithItems || plWithItems.items.length !== 1) {
    throw new Error("Playlist items addition failed");
  }

  await repository.deletePlaylist(testUserId, playlist.id);
  const deleted = await repository.getPlaylistWithItems(playlist.id);
  if (deleted !== null) throw new Error("Playlist deletion failed");
  console.log("✓ Playlists and cascade deletion verified");

  // Likes
  const likeRes = await repository.toggleLikeVideo(testUserId, {
    videoId: "test-v1",
    title: "Liked Video",
    channelTitle: "Test Channel",
  });
  if (!likeRes.liked) throw new Error("Like toggle true failed");
  const isLiked = await repository.isLikedVideo(testUserId, "test-v1");
  if (!isLiked) throw new Error("isLikedVideo failed");
  const unlikeRes = await repository.toggleLikeVideo(testUserId, {
    videoId: "test-v1",
    title: "Liked Video",
    channelTitle: "Test Channel",
  });
  if (unlikeRes.liked) throw new Error("Like toggle false failed");
  console.log("✓ Video likes toggle verified");

  // 3. YouTube Service Tests
  console.log("\n[3/3] Testing YouTube Service & Cache...");
  const feed = await youtubeService.getTrendingFeed();
  if (!feed.videos || feed.videos.length === 0) throw new Error("getTrendingFeed failed");
  console.log(`✓ Trending feed fetched (${feed.videos.length} videos)`);

  const video = await youtubeService.getVideoDetails(feed.videos[0].id);
  if (!video || !video.title) throw new Error("getVideoDetails failed");
  console.log(`✓ Video details verified: "${video.title}"`);

  const comments = await youtubeService.getVideoComments(feed.videos[0].id);
  if (!comments.comments) throw new Error("getVideoComments failed");
  console.log(`✓ Video comments verified (${comments.comments.length} comments)`);

  const searchRes = await youtubeService.search("music");
  if (!searchRes.items || searchRes.items.length === 0) throw new Error("search failed");
  console.log(`✓ Search verified (${searchRes.items.length} items)`);

  console.log("\n=== ALL TEST SUITES PASSED WITH 100% SUCCESS! ===");
}

runTestSuite().catch((err) => {
  console.error("\n❌ TEST FAILED:", err);
  process.exit(1);
});
