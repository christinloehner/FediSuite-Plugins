import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

const BLUESKY_DEFAULT_PDS = 'https://bsky.social';
const BLUESKY_PUBLIC_APPVIEW = 'https://public.api.bsky.app';
const BLUESKY_MAX_CHARACTERS = 300;
const BLUESKY_MAX_MEDIA_ATTACHMENTS = 4;
const BLUESKY_POST_COLLECTION = 'app.bsky.feed.post';

function normalizePdsUrl(value) {
  const raw = String(value || '').trim();
  const candidate = raw || BLUESKY_DEFAULT_PDS;
  try {
    const url = new URL(candidate.startsWith('http') ? candidate : `https://${candidate}`);
    url.pathname = '';
    url.search = '';
    url.hash = '';
    return url.toString().replace(/\/$/, '');
  } catch {
    throw new Error('Invalid Bluesky PDS host.');
  }
}

function normalizeIdentifier(value) {
  const normalized = String(value || '').trim();
  if (!normalized) throw new Error('Bluesky handle or DID is required.');
  return normalized;
}

function normalizeAppPassword(value) {
  const normalized = String(value || '').trim();
  if (!normalized) throw new Error('A Bluesky app password is required.');
  return normalized;
}

function getMimeTypeForFile(filePath) {
  const extension = path.extname(String(filePath || '')).toLowerCase();
  switch (extension) {
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.gif':
      return 'image/gif';
    case '.webp':
      return 'image/webp';
    case '.mp4':
      return 'video/mp4';
    case '.mov':
      return 'video/quicktime';
    case '.webm':
      return 'video/webm';
    default:
      return 'application/octet-stream';
  }
}

function trimTrailingSlash(value) {
  return String(value || '').replace(/\/+$/, '');
}

function extractPostRkey(uri = '') {
  const parts = String(uri || '').split('/');
  return parts[parts.length - 1] || '';
}

function buildBlueskyPostUrl(handle, uri) {
  const normalizedHandle = String(handle || '').trim();
  const rkey = extractPostRkey(uri);
  if (!normalizedHandle || !rkey) return '';
  return `https://bsky.app/profile/${encodeURIComponent(normalizedHandle)}/post/${encodeURIComponent(rkey)}`;
}

function extractHashtags(text = '') {
  const matches = String(text || '').match(/#([\p{L}\p{N}_-]+)/gu) || [];
  return [...new Set(matches.map((entry) => entry.slice(1).toLowerCase()).filter(Boolean))];
}

function parseStoredPostRef(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && typeof parsed.uri === 'string' && typeof parsed.cid === 'string') {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}

function createStoredPostRef({ uri, cid, replyRef = null }) {
  return JSON.stringify({
    uri,
    cid,
    rootUri: replyRef?.rootUri || replyRef?.uri || uri,
    rootCid: replyRef?.rootCid || replyRef?.cid || cid,
  });
}

function buildReplyPayload(inReplyToId) {
  const replyRef = parseStoredPostRef(inReplyToId);
  if (!replyRef) return null;
  return {
    root: {
      uri: replyRef.rootUri || replyRef.uri,
      cid: replyRef.rootCid || replyRef.cid,
    },
    parent: {
      uri: replyRef.uri,
      cid: replyRef.cid,
    },
  };
}

function buildPostRecord(post) {
  const text = String(post?.content || '').trim();
  if (!text && !(Array.isArray(post?.media_files) && post.media_files.length > 0)) {
    throw new Error('Bluesky posts require text or media.');
  }

  const record = {
    $type: BLUESKY_POST_COLLECTION,
    text,
    createdAt: new Date().toISOString(),
  };

  const language = String(post?.language || '').trim();
  if (language) {
    record.langs = [language];
  }

  const reply = buildReplyPayload(post?.in_reply_to_id);
  if (reply) {
    record.reply = reply;
  }

  return record;
}

async function atprotoRequest({ url, method = 'GET', headers = {}, params, data, responseType }) {
  return axios({
    url,
    method,
    headers,
    params,
    data,
    responseType,
    timeout: 60000,
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
    validateStatus: () => true,
  });
}

async function createSession({ identifier, appPassword, pdsUrl }) {
  const response = await atprotoRequest({
    url: `${pdsUrl}/xrpc/com.atproto.server.createSession`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: {
      identifier,
      password: appPassword,
    },
  });

  if (response.status >= 400) {
    throw new Error(response.data?.message || response.data?.error || 'Bluesky session could not be created.');
  }

  return response.data || {};
}

async function refreshSession(account, pool) {
  const response = await atprotoRequest({
    url: `${trimTrailingSlash(account.instance_url)}/xrpc/com.atproto.server.refreshSession`,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${account.refresh_token}`,
    },
  });

  if (response.status >= 400) {
    throw new Error(response.data?.message || response.data?.error || 'Bluesky session refresh failed.');
  }

  const session = response.data || {};
  if (session.accessJwt && session.refreshJwt) {
    await pool.query(
      'UPDATE accounts SET access_token = $1, refresh_token = $2 WHERE id = $3',
      [session.accessJwt, session.refreshJwt, account.id]
    );
    account.access_token = session.accessJwt;
    account.refresh_token = session.refreshJwt;
  }

  if (session.did) {
    account.client_id = session.did;
  }
  if (session.handle) {
    account.username = session.handle;
  }

  return session;
}

async function authedRequest({ account, pool, method = 'GET', endpoint, params, data, headers = {}, responseType }) {
  const execute = () => atprotoRequest({
    url: `${trimTrailingSlash(account.instance_url)}${endpoint}`,
    method,
    params,
    data,
    responseType,
    headers: {
      Authorization: `Bearer ${account.access_token}`,
      ...headers,
    },
  });

  let response = await execute();
  if (response.status === 401 && account.refresh_token) {
    await refreshSession(account, pool);
    response = await execute();
  }

  if (response.status >= 400) {
    throw new Error(response.data?.message || response.data?.error || `Bluesky request failed for ${endpoint}.`);
  }

  return response.data;
}

async function fetchProfile({ actor, account = null, pool = null }) {
  if (account && pool) {
    return authedRequest({
      account,
      pool,
      endpoint: '/xrpc/app.bsky.actor.getProfile',
      params: { actor },
    });
  }

  const response = await atprotoRequest({
    url: `${BLUESKY_PUBLIC_APPVIEW}/xrpc/app.bsky.actor.getProfile`,
    params: { actor },
  });
  if (response.status >= 400) {
    throw new Error(response.data?.message || response.data?.error || 'Bluesky profile lookup failed.');
  }
  return response.data || {};
}

function buildConnectedAccount({ session, profile, pdsUrl }) {
  return {
    instance_url: pdsUrl,
    username: session.handle || profile.handle || session.did,
    display_name: profile.displayName || session.handle || session.did,
    avatar_url: profile.avatar || null,
    access_token: session.accessJwt,
    refresh_token: session.refreshJwt,
    client_id: session.did || null,
    client_secret: null,
    stats_followers: Number(profile.followersCount ?? 0) || 0,
    stats_following: Number(profile.followsCount ?? 0) || 0,
    stats_statuses: Number(profile.postsCount ?? 0) || 0,
    max_characters: BLUESKY_MAX_CHARACTERS,
    characters_reserved_per_url: 0,
    max_media_attachments: BLUESKY_MAX_MEDIA_ATTACHMENTS,
  };
}

function resolveActorIdentifier(account) {
  return String(account?.client_id || account?.username || '').trim();
}

function normalizePostSnapshot(feedItem, fallbackHandle) {
  const postView = feedItem?.post || {};
  const author = postView.author || {};
  const record = postView.record || {};
  const uri = String(postView.uri || '').trim();
  if (!uri) return null;

  return {
    fediversePostId: uri,
    content: String(record.text || '').trim(),
    url: buildBlueskyPostUrl(author.handle || fallbackHandle, uri),
    createdAt: record.createdAt || postView.indexedAt || new Date().toISOString(),
    favouritesCount: Number(postView.likeCount ?? 0) || 0,
    reblogsCount: Number(postView.repostCount ?? 0) || 0,
    repliesCount: Number(postView.replyCount ?? 0) || 0,
    visibility: 'public',
    mediaCount: Array.isArray(postView.embed?.images)
      ? postView.embed.images.length
      : postView.embed?.$type === 'app.bsky.embed.video#view'
        ? 1
        : 0,
    hashtags: extractHashtags(record.text || ''),
  };
}

async function replacePostHashtags(pool, accountId, fediversePostId, hashtags = []) {
  await pool.query(
    'DELETE FROM post_hashtags WHERE account_id = $1 AND fediverse_post_id = $2',
    [accountId, fediversePostId]
  );

  if (!Array.isArray(hashtags) || hashtags.length === 0) return;

  const unique = [...new Set(hashtags.map((entry) => String(entry || '').trim().toLowerCase()).filter(Boolean))];
  if (unique.length === 0) return;

  const valuesSql = unique.map((_, index) => `($1, $2, $${index + 3})`).join(', ');
  await pool.query(
    `INSERT INTO post_hashtags (account_id, fediverse_post_id, tag)
     VALUES ${valuesSql}
     ON CONFLICT (account_id, fediverse_post_id, tag) DO NOTHING`,
    [accountId, fediversePostId, ...unique]
  );
}

async function upsertPostSnapshot(pool, accountId, snapshot) {
  if (!snapshot?.fediversePostId) return;
  await pool.query(
    `INSERT INTO post_stats (account_id, fediverse_post_id, content, url, created_at, favourites_count, reblogs_count, replies_count, visibility, media_count)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (account_id, fediverse_post_id) DO UPDATE SET
       content = EXCLUDED.content,
       url = EXCLUDED.url,
       created_at = EXCLUDED.created_at,
       favourites_count = EXCLUDED.favourites_count,
       reblogs_count = EXCLUDED.reblogs_count,
       replies_count = EXCLUDED.replies_count,
       visibility = EXCLUDED.visibility,
       media_count = EXCLUDED.media_count,
       fetched_at = NOW()`,
    [
      accountId,
      snapshot.fediversePostId,
      snapshot.content || '',
      snapshot.url || '',
      snapshot.createdAt,
      snapshot.favouritesCount || 0,
      snapshot.reblogsCount || 0,
      snapshot.repliesCount || 0,
      snapshot.visibility || 'public',
      snapshot.mediaCount || 0,
    ]
  );

  await replacePostHashtags(pool, accountId, snapshot.fediversePostId, snapshot.hashtags || []);
}

async function fetchAuthorFeed({ account, pool, cursor = null, limit = 100 }) {
  const actor = resolveActorIdentifier(account);
  return authedRequest({
    account,
    pool,
    endpoint: '/xrpc/app.bsky.feed.getAuthorFeed',
    params: {
      actor,
      limit,
      filter: 'posts_no_replies',
      ...(cursor ? { cursor } : {}),
    },
  });
}

function filterFeedItems(feedItems) {
  return (Array.isArray(feedItems) ? feedItems : []).filter((item) => {
    const postView = item?.post || {};
    const record = postView.record || {};
    if (!postView.uri || record.$type !== BLUESKY_POST_COLLECTION) return false;
    if (item?.reason) return false;
    if (record.reply) return false;
    return true;
  });
}

async function importOrRefreshFeed({ account, accountId, pool, cursor = null, pageLimit = 5, globalCap = Infinity }) {
  let nextCursor = cursor;
  let pagesFetched = 0;
  let totalFetched = 0;

  while (pagesFetched < pageLimit && totalFetched < globalCap) {
    const payload = await fetchAuthorFeed({ account, pool, cursor: nextCursor });
    const items = filterFeedItems(payload?.feed);
    if (items.length === 0) {
      nextCursor = null;
      break;
    }

    for (const item of items) {
      const snapshot = normalizePostSnapshot(item, account.username);
      if (!snapshot) continue;
      await upsertPostSnapshot(pool, accountId, snapshot);
      totalFetched += 1;
      if (totalFetched >= globalCap) break;
    }

    pagesFetched += 1;
    nextCursor = payload?.cursor || null;
    if (!nextCursor) break;
  }

  return {
    totalFetched,
    pagesFetched,
    cursorData: nextCursor ? { cursor: nextCursor } : {},
  };
}

async function uploadBlob({ account, pool, filePath, mimeType }) {
  const body = await fs.readFile(filePath);
  const data = await authedRequest({
    account,
    pool,
    method: 'POST',
    endpoint: '/xrpc/com.atproto.repo.uploadBlob',
    data: body,
    headers: {
      'Content-Type': mimeType,
    },
  });
  return data?.blob || null;
}

async function buildEmbed({ account, pool, mediaFiles = [], altTexts = [] }) {
  if (!Array.isArray(mediaFiles) || mediaFiles.length === 0) return null;

  const uploads = await Promise.all(mediaFiles.map(async (filePath, index) => ({
    blob: await uploadBlob({
      account,
      pool,
      filePath,
      mimeType: getMimeTypeForFile(filePath),
    }),
    alt: String(altTexts[index] || '').trim(),
    mimeType: getMimeTypeForFile(filePath),
  })));

  const videoUploads = uploads.filter((entry) => entry.mimeType.startsWith('video/'));
  const imageUploads = uploads.filter((entry) => entry.mimeType.startsWith('image/'));

  if (videoUploads.length > 1 || (videoUploads.length > 0 && imageUploads.length > 0)) {
    throw new Error('Bluesky currently supports either one video or up to four images per post.');
  }

  if (videoUploads.length === 1) {
    return {
      $type: 'app.bsky.embed.video',
      video: videoUploads[0].blob,
    };
  }

  return {
    $type: 'app.bsky.embed.images',
    images: uploads.map((entry) => ({
      alt: entry.alt,
      image: entry.blob,
    })),
  };
}

async function publishToBluesky({ account, pool, post }) {
  const record = buildPostRecord(post);
  const embed = await buildEmbed({
    account,
    pool,
    mediaFiles: Array.isArray(post?.media_files) ? post.media_files : [],
    altTexts: Array.isArray(post?.media_alt_texts) ? post.media_alt_texts : [],
  });
  if (embed) {
    record.embed = embed;
  }

  const payload = await authedRequest({
    account,
    pool,
    method: 'POST',
    endpoint: '/xrpc/com.atproto.repo.createRecord',
    headers: {
      'Content-Type': 'application/json',
    },
    data: {
      repo: resolveActorIdentifier(account) || account.username,
      collection: BLUESKY_POST_COLLECTION,
      record,
    },
  });

  return {
    id: createStoredPostRef({
      uri: payload?.uri,
      cid: payload?.cid,
      replyRef: parseStoredPostRef(post?.in_reply_to_id),
    }),
  };
}

export function register(context) {
  context.registerProvider({
    id: 'bluesky',
    display_name: context.ref('providers.main.displayName', 'Bluesky'),
    description: context.ref('providers.main.description', 'Connect a Bluesky account using a handle, app password and optional PDS host.'),
    auth: {
      type: 'credentials',
      callback_path: '/api/providers/bluesky/callback',
    },
    capabilities: {
      connect: true,
      disconnect: true,
      publish: true,
      import_historical: true,
      refresh_stats: true,
      refresh_posts: true,
      composer_profile: {
        title: 'Bluesky',
        placeholder: 'What is happening in your corner of Bluesky?',
        text_label: 'Post text',
        text_rows: 5,
        content_required: true,
        media_required: false,
        media_mode: 'any',
        max_media_override: 4,
        supports_cw: false,
        supports_visibility: false,
        visibility_options: ['public'],
      },
    },
    beginConnection: async () => ({
      redirect_url: `/api/plugins/${encodeURIComponent(context.plugin.plugin_id)}/web/assets/bluesky-connect.html?providerId=bluesky`,
    }),
    handleCallback: async ({ req, pool }) => {
      if (String(req.method || '').toUpperCase() !== 'POST') {
        throw new Error('Bluesky account setup must be completed from the plugin connect form.');
      }

      const identifier = normalizeIdentifier(req.body?.identifier);
      const appPassword = normalizeAppPassword(req.body?.appPassword);
      const pdsUrl = normalizePdsUrl(req.body?.pdsUrl);

      const session = await createSession({ identifier, appPassword, pdsUrl });
      const profile = await fetchProfile({ actor: session.did || session.handle || identifier, account: {
        id: 0,
        instance_url: pdsUrl,
        access_token: session.accessJwt,
        refresh_token: session.refreshJwt,
        client_id: session.did || null,
        username: session.handle || identifier,
      }, pool });

      return {
        user_id: req.user?.id || null,
        account: buildConnectedAccount({ session, profile, pdsUrl }),
        start_import: true,
      };
    },
    disconnect: async () => ({
      disconnected: true,
    }),
    publishPost: async ({ account, post, pool }) => publishToBluesky({ account, pool, post }),
    importHistoricalData: async ({ account, accountId, pool, jobContext }) => {
      const importState = await importOrRefreshFeed({
        account,
        accountId,
        pool,
        cursor: jobContext?.cursorData?.cursor || null,
        pageLimit: 1000,
      });
      return {
        handled: true,
        totalFetched: importState.totalFetched,
        pagesFetched: importState.pagesFetched,
        cursorData: importState.cursorData,
      };
    },
    refreshStats: async ({ account, pool }) => {
      const profile = await fetchProfile({
        actor: resolveActorIdentifier(account) || account.username,
        account,
        pool,
      });

      return {
        account: {
          display_name: profile.displayName || account.display_name || account.username,
          avatar_url: profile.avatar || account.avatar_url || null,
          stats_followers: Number(profile.followersCount ?? account.stats_followers ?? 0) || 0,
          stats_following: Number(profile.followsCount ?? account.stats_following ?? 0) || 0,
          stats_statuses: Number(profile.postsCount ?? account.stats_statuses ?? 0) || 0,
          max_characters: BLUESKY_MAX_CHARACTERS,
          characters_reserved_per_url: 0,
          max_media_attachments: BLUESKY_MAX_MEDIA_ATTACHMENTS,
        },
      };
    },
    refreshPosts: async ({ account, accountId, pool }) => {
      const hoursSinceFetch = account.last_posts_fetch_at
        ? (Date.now() - new Date(account.last_posts_fetch_at).getTime()) / (1000 * 60 * 60)
        : Infinity;
      const pageLimit = hoursSinceFetch > 24 ? 5 : 2;

      await importOrRefreshFeed({
        account,
        accountId,
        pool,
        cursor: null,
        pageLimit,
        globalCap: pageLimit * 100,
      });

      return {
        handled: true,
      };
    },
  });
}
