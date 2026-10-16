(function () {
  const DRAFTS_KEY = "bloomary_drafts";
  const LINKEDIN_TOKEN_KEY = "bloomary_linkedin_token";
  // Include the API host's httpOnly session cookie on API calls only.
  const nativeFetch = window.fetch.bind(window);
  const fetch = async (input, init = {}) => {
    if (!String(input).startsWith(API_BASE_URL + "/")) return nativeFetch(input, init);
    const url = new URL(input);
    const started = performance.now();
    // Never log query strings, bodies, headers, cookies, or OAuth response data.
    const details = () => ({
      method: init.method || "GET", endpoint: url.origin + url.pathname,
      pageOrigin: window.location.origin, online: navigator.onLine,
      durationMs: Math.round(performance.now() - started)
    });
    try {
      const response = await nativeFetch(input, { ...init, credentials: "include" });
      if (!response.ok) {
        console.warn("[Bloomary API] HTTP failure", { ...details(), status: response.status });
      } else if (url.pathname.startsWith("/api/linkedin/cli/")) {
        console.info("[Bloomary login] Request completed", { ...details(), status: response.status });
      }
      return response;
    } catch (error) {
      console.error("[Bloomary API] Network or CORS failure", { ...details(), errorType: error.name });
      throw new Error("Cannot reach Bloomary. Check your connection and try again. If it persists, see the browser console for request details.", { cause: error });
    }
  };

  const LINKEDIN_OAUTH_STATE_KEY = "bloomary_linkedin_oauth_state";
  const GEMINI_API_KEY = "bloomary_gemini_api_key";
  const POST_LANGUAGE_KEY = "bloomary_post_language";
  const SAME_AS_DRAFT = "same";
  const COOKIE_POLICY_CHOICE_KEY = "bloomary_cookie_policy_choice";
  const REDUCE_DATA_KEY = "bloomary_reduce_data";
  const LINKEDIN_PUBLISHING_ENABLED = true;
  const DEFAULT_DRAFT_LIMIT = 5;
  const DRAFT_SYNC_ENTITLEMENT_TTL_MS = 300_000;
  const GEMINI_INTERACTIONS_URL = "https://generativelanguage.googleapis.com/v1beta/interactions";
  const GEMINI_MODEL = "gemini-3.8-flash";
  const CONFIG = window.BLOOMARY_CONFIG || {};
  const API_BASE_URL = CONFIG.apiBaseUrl || "https://api.bloomary.life";
  const SCHEDULE_MIN_AHEAD_MS = 5 * 60_000;
  const SCHEDULE_MAX_AHEAD_DAYS = Math.max(1, Number(CONFIG.scheduleMaxAheadDays) || 31);
  const VIEW_PATHS = { editor: "/editor", drafts: "/drafts", insights: "/insights", settings: "/settings" };

  const editor = document.getElementById("editor");
  const previewBody = document.getElementById("previewBody");
  const previewCard = document.getElementById("previewCard");
  const previewAvatar = document.getElementById("previewAvatar");
  const previewName = document.getElementById("previewName");
  const previewHeadline = document.getElementById("previewHeadline");
  const previewImage = document.getElementById("previewImage");
  const moreToggle = document.getElementById("moreToggle");
  const toast = document.getElementById("toast");
  const previewPane = document.querySelector(".preview-pane");
  const topActions = document.querySelector(".top-actions");
  const postTimeCard = document.querySelector(".post-time-card");
  const editorView = document.getElementById("editorView");
  const draftsView = document.getElementById("draftsView");
  const insightsView = document.getElementById("insightsView");
  const settingsView = document.getElementById("settingsView");
  const draftRows = document.getElementById("draftRows");
  const draftEmpty = document.getElementById("draftEmpty");
  const draftFilter = document.getElementById("draftFilter");
  const draftScopeButtons = document.querySelectorAll("[data-draft-scope]");
  const draftScheduleDialog = document.getElementById("draftScheduleDialog");
  const draftScheduleTitle = document.getElementById("draftScheduleTitle");
  const draftScheduleAt = document.getElementById("draftScheduleAt");
  const draftScheduleClose = document.getElementById("draftScheduleClose");
  const draftScheduleCancel = document.getElementById("draftScheduleCancel");
  const draftScheduleConfirm = document.getElementById("draftScheduleConfirm");
  const navEditor = document.getElementById("navEditor");
  const navDrafts = document.getElementById("navDrafts");
  const navInsights = document.getElementById("navInsights");
  const bestPostTime = document.getElementById("bestPostTime");
  const bestPostDay = document.getElementById("bestPostDay");
  const bestPostTomorrow = document.getElementById("bestPostTomorrow");
  const navSettings = document.getElementById("navSettings");
  const linkedinStatus = document.getElementById("linkedinStatus");
  const linkedinDisconnectedStatus = document.getElementById("linkedinDisconnectedStatus");
  const linkedinConnect = document.getElementById("linkedinConnect");
  const linkedinDisconnect = document.getElementById("linkedinDisconnect");
  const linkedinProfileCard = document.getElementById("linkedinProfileCard");
  const linkedinProfilePicture = document.getElementById("linkedinProfilePicture");
  const linkedinProfileName = document.getElementById("linkedinProfileName");
  const linkedinProfileEmail = document.getElementById("linkedinProfileEmail");
  const linkedinTokenExpiry = document.getElementById("linkedinTokenExpiry");
  const paddleBillingBox = document.getElementById("paddleBillingBox");
  const paddleBillingHome = paddleBillingBox?.parentElement;
  const paddleBillingHomeNext = paddleBillingBox?.nextElementSibling;
  const planSheet = document.getElementById("planSheet");
  const planSheetTitle = document.getElementById("planSheetTitle");
  const planSheetBody = document.getElementById("planSheetBody");
  const paddleBillingTitle = document.getElementById("paddleBillingTitle");
  const paddleBillingStatus = document.getElementById("paddleBillingStatus");
  const paddleSubscribe = document.getElementById("paddleSubscribe");
  const paddleSubscribeYearly = document.getElementById("paddleSubscribeYearly");
  const paddleManage = document.getElementById("paddleManage");
  const trialProgress = document.getElementById("trialProgress");
  const tierBanner = document.getElementById("tierBanner");
  const tierBannerText = document.getElementById("tierBannerText");
  const tierBannerNote = document.getElementById("tierBannerNote");
  const tierBannerAction = document.getElementById("tierBannerAction");
  const accountDeletionStatus = document.getElementById("accountDeletionStatus");
  const deleteAccount = document.getElementById("deleteAccount");
  const exportDrafts = document.getElementById("exportDrafts");
  const dangerZone = document.getElementById("dangerZone");
  const feedbackButton = document.getElementById("feedbackButton");
  const feedbackForm = document.getElementById("feedbackForm");
  const feedbackMessage = document.getElementById("feedbackMessage");
  const feedbackCancel = document.getElementById("feedbackCancel");
  const publishLinkedIn = document.getElementById("publishLinkedIn");
  const scheduleAt = document.getElementById("scheduleAt");
  const schedulePost = document.getElementById("schedulePost");
  const attachPostFile = document.getElementById("attachPostFile");
  const naturalizeEnglish = document.getElementById("naturalizeEnglish");
  const postAttachment = document.getElementById("postAttachment");
  const attachmentName = document.getElementById("attachmentName");
  const removeAttachment = document.getElementById("removeAttachment");
  const startFromInsight = document.getElementById("startFromInsight");
  const geminiAPIKey = document.getElementById("geminiAPIKey");
  const geminiStatus = document.getElementById("geminiStatus");
  const postLanguage = document.getElementById("postLanguage");
  const saveGeminiAPIKey = document.getElementById("saveGeminiAPIKey");
  const clearGeminiAPIKey = document.getElementById("clearGeminiAPIKey");
  const manageGeminiAPIKey = document.getElementById("manageGeminiAPIKey");
  const geminiKeyControls = document.getElementById("geminiKeyControls");
  const syncSettingsBox = document.getElementById("syncSettingsBox");
  const syncEnabledToggle = document.getElementById("syncEnabledToggle");
  const syncToggleStatus = document.getElementById("syncToggleStatus");
  const imageEditorModal = document.getElementById("imageEditorModal");
  const imageEditorCancel = document.getElementById("imageEditorCancel");
  const imageEditorClear = document.getElementById("imageEditorClear");
  const imageEditorDrop = document.getElementById("imageEditorDrop");
  const imageEditorFile = document.getElementById("imageEditorFile");
  const imageEditorStage = document.getElementById("imageEditorStage");
  const imageEditorCanvas = document.getElementById("imageEditorCanvas");
  const imageEditorText = document.getElementById("imageEditorText");
  const imageEditorStyle = document.getElementById("imageEditorStyle");
  const imageEditorAlign = document.getElementById("imageEditorAlign");
  const imageEditorDone = document.getElementById("imageEditorDone");
  const openEmojiPicker = document.getElementById("openEmojiPicker");
  const emojiModal = document.getElementById("emojiModal");
  const emojiPickerClose = document.getElementById("emojiPickerClose");
  const emojiPickerGrid = document.getElementById("emojiPickerGrid");

  let toastTimer = null;
  let linkedInAuthInFlight = false;
  let pendingPostAttachment = null;
  let previewAttachmentFile = null;
  let previewAttachmentUrl = null;
  const DEFAULT_DRAFT_SYNC_ACCESS = { memberId: "", accessToken: "", tier: "", isPro: false, subscriptionSource: "", accessUntil: "", draftLimit: DEFAULT_DRAFT_LIMIT, checkedAt: 0 };
  let draftSyncAccess = { ...DEFAULT_DRAFT_SYNC_ACCESS };
  let draftScope = "all";
  let draftToSchedule = null;
  let scheduledPosts = [];
  let tierNotice = null;
  // IndexedDB store for cached draft images (cache-then-refresh).
  const IMAGE_CACHE_STORE = 'bloomary-draft-images';
  function _openImageCache() {
    return new Promise((ok, fail) => {
      const r = indexedDB.open('bloomary-cache', 1);
      r.onupgradeneeded = e => { const db = e.target.result; if (!db.objectStoreNames.contains(IMAGE_CACHE_STORE)) db.createObjectStore(IMAGE_CACHE_STORE, { keyPath: 'key' }); };
      r.onsuccess = () => {
        const db = r.result;
        db.onversionchange = () => db.close();
        ok(db);
      };
      r.onerror = () => fail(r.error);
    });
  }
  async function _imageCacheGet(checksum) {
    let db;
    try {
      db = await _openImageCache();
      return await new Promise(ok => {
        const t = db.transaction(IMAGE_CACHE_STORE, 'readonly');
        const q = t.objectStore(IMAGE_CACHE_STORE).get(checksum);
        q.onsuccess = () => ok(q.result?.data || null);
        q.onerror = t.onabort = () => ok(null);
      });
    } catch { return null; }
    finally { db?.close(); }
  }
  async function _imageCachePut(checksum, data) {
    let db;
    try {
      db = await _openImageCache();
      await new Promise(ok => {
        const t = db.transaction(IMAGE_CACHE_STORE, 'readwrite');
        t.objectStore(IMAGE_CACHE_STORE).put({ key: checksum, data });
        t.oncomplete = t.onerror = t.onabort = () => ok();
      });
    } catch {}
    finally { db?.close(); }
  }

  function updateDraftCountUI() {
    const el = document.getElementById("draftCount");
    if (!el) return;
    const drafts = readStore(DRAFTS_KEY) || [];
    el.textContent = `${drafts.length}/${draftSyncAccess.draftLimit}`;
  }

  function shouldBlockNewDraft() {
    const drafts = readStore(DRAFTS_KEY) || [];
    return activeDraftId == null && drafts.length >= draftSyncAccess.draftLimit;
  }

  // lapsed: an opened or just-saved draft is frozen. Locked controls stay clickable and open the plan sheet.
  function updateSaveDraftButton() {
    const button = document.getElementById("saveDraft");
    if (!button) return;
    const lapsed = draftSyncAccess.tier === "lapsed";
    editor.readOnly = lapsed && activeDraftId != null;
    document.querySelectorAll(".formatbar button, .formatbar select").forEach((control) => {
      if (control.id !== "showPreview") control.disabled = editor.readOnly;
    });
    button.disabled = false;
    button.title = shouldBlockNewDraft() ? "Draft limit reached" : "Save as new draft";
    button.classList.toggle("is-locked", editor.readOnly || (lapsed && shouldBlockNewDraft()));
    publishLinkedIn.classList.toggle("is-locked", lapsed);
    document.getElementById("scheduleMenu").querySelector("summary").classList.toggle("is-locked", lapsed);
  }
  let imageEditorImage = null;
  let imageEditorCaptionTrimmed = false;
  let imageEditorDrag = null;
  let savedEditorSelection = null;
  let activeDraftId = null;
  let lastRemoteFetchAt = 0;
  const PENDING_MUTATIONS_KEY = "bloomary_pending_mutations";
  // Failed sync batches as draft IDs; drafts are re-read from storage on retry.
  let pendingMutations = readStore(PENDING_MUTATIONS_KEY);
  const MAX_MUTATION_RETRIES = 3;
  let keepRemoteImage = false;
  const imageEditorState = {
    textX: 0.5,
    textY: 0.45,
    textScale: 0.09,
    styleIndex: 0,
    alignIndex: 0
  };
  const imageEditorStyles = [
    { foreground: "#ffffff", background: "rgba(0, 0, 0, 0.55)" },
    { foreground: "#000000", background: "rgba(255, 255, 255, 0.86)" },
    { foreground: "#ffffff", background: "transparent" }
  ];
  const imageEditorAlignments = ["center", "left", "right"];
  const weekdayPostTimes = ["10:00-12:00", "09:00-11:00", "10:00-12:00", "09:00-11:00", "10:00-12:00", "09:00-10:00", "10:00-12:00"];
  const emojis = [
    "😀", "😄", "😊", "🙂", "😉", "😍", "🥳", "🔥",
    "✨", "💡", "✅", "🚀", "📌", "📈", "💬", "👏",
    "🙏", "🤝", "🎯", "⭐", "❤️", "💙", "🧠", "✍️",
    "👀", "🙌", "⚡️", "🏆", "💪", "🌱", "🔔", "🧩"
  ];

  function readStore(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || "[]");
    } catch (_error) {
      return [];
    }
  }

  function writeStore(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function removeStore(key) {
    localStorage.removeItem(key);
  }

  function hasCookiePolicyChoice() {
    try {
      return Boolean(localStorage.getItem(COOKIE_POLICY_CHOICE_KEY));
    } catch (_error) {
      return false;
    }
  }

  function saveCookiePolicyChoice(choice) {
    try {
      localStorage.setItem(COOKIE_POLICY_CHOICE_KEY, choice);
    } catch (_error) {
      // The user can still continue in browsers that block localStorage.
    }
  }

  function renderCookieConsent() {
    if (hasCookiePolicyChoice() || document.getElementById("cookieConsent")) return;
    const banner = document.createElement("section");
    banner.id = "cookieConsent";
    banner.className = "cookie-consent";
    banner.setAttribute("aria-label", "Cookie policy consent");
    banner.innerHTML = `
      <p>
        Bloomary uses essential browser storage for drafts, Gemini keys, and LinkedIn login as described in the
        <a href="https://bloomary.life/cookie-policy/" target="_blank" rel="noopener">Cookie Policy</a>.
      </p>
      <div>
        <button type="button" data-cookie-choice="essential">Essential only</button>
      </div>`;
    document.body.appendChild(banner);
    banner.addEventListener("click", (event) => {
      const button = event.target.closest("[data-cookie-choice]");
      if (!button) return;
      saveCookiePolicyChoice(button.dataset.cookieChoice);
      banner.remove();
    });
  }

  function readGeminiAPIKey() {
    try {
      const legacyKey = localStorage.getItem(GEMINI_API_KEY);
      if (legacyKey) {
        localStorage.removeItem(GEMINI_API_KEY);
        if (!sessionStorage.getItem(GEMINI_API_KEY)) sessionStorage.setItem(GEMINI_API_KEY, legacyKey);
      }
      return sessionStorage.getItem(GEMINI_API_KEY) || "";
    } catch (_error) {
      return "";
    }
  }

  function readPostLanguage() {
    try {
      return localStorage.getItem(POST_LANGUAGE_KEY) || "English";
    } catch (_error) {
      return "English";
    }
  }

  function savePostLanguage(value) {
    try {
      localStorage.setItem(POST_LANGUAGE_KEY, value);
    } catch (_error) {}
  }

  function naturalizePrompt(language) {
    const target = language === SAME_AS_DRAFT
      ? "Write the result in the same language as the draft."
      : `Write the result in ${language}. The draft may be in any language; if it is not in ${language}, translate it into natural ${language} without changing the meaning.`;
    const languageName = language === SAME_AS_DRAFT ? "the draft's language" : language;
    return `You receive a LinkedIn post draft from the user. ${target} Draft a LinkedIn post, fix grammar, make the ${languageName} sound natural, preserve the user's style, and do not modify meaning. Make the result sound more like the user: preserve their voice, rhythm, directness, emotional logic, and slightly non-native but clear phrasing when it adds authenticity. Make it hooked in the first 2-3 sentences. Carefully compress the draft: eliminate unnecessary words and replace longer words with shorter ones, ensuring the post retains its original meaning, information, and tone. Wrap any moments you want highlighted — results, numbers, surprising facts, punchy one-liners — in double asterisks like **this**. End the post with exactly three relevant hashtags on one final line. Replace or deduplicate any existing hashtags so the final post contains exactly three hashtags total. Do not explain your edits or wrap the answer in quotes. Return only the edited post.`;
  }

  function renderAISettings() {
    const hasKey = Boolean(readGeminiAPIKey());
    geminiAPIKey.value = hasKey ? "********" : "";
    geminiStatus.textContent = hasKey ? "Connected" : "Add your Gemini API key to use AI editing.";
    manageGeminiAPIKey.textContent = hasKey ? "Manage" : "Add API key";
    clearGeminiAPIKey.disabled = !hasKey;
    if (postLanguage) postLanguage.value = readPostLanguage();
  }

  const legacyLinkedInToken = readStore(LINKEDIN_TOKEN_KEY);
  if (legacyLinkedInToken && Object.keys(legacyLinkedInToken).length && legacyLinkedInToken.accessToken !== "web-session") {
    removeStore(LINKEDIN_TOKEN_KEY);
  }

  function isLinkedInTokenExpired(token) {
    const expiresAt = Date.parse(token?.expiresAt || "");
    return Number(token?.expiresIn) > 0 && Number.isFinite(expiresAt) && expiresAt <= Date.now();
  }

  function updateLinkedInTokenExpiry() {
    if (!linkedinTokenExpiry) return;
    const token = readStore(LINKEDIN_TOKEN_KEY);
    const expiresAt = Date.parse(token?.expiresAt || "");
    if (!Number.isFinite(expiresAt)) { linkedinTokenExpiry.hidden = true; return; }
    if (expiresAt <= Date.now()) {
      linkedinTokenExpiry.textContent = "LinkedIn token expired";
      linkedinTokenExpiry.classList.add("expired");
      linkedinTokenExpiry.hidden = false;
    } else {
      linkedinTokenExpiry.textContent = "Expires " + new Date(expiresAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
      linkedinTokenExpiry.classList.remove("expired");
      linkedinTokenExpiry.hidden = false;
    }
  }

  function hasLinkedInToken(token) {
    return Boolean(token && typeof token === "object" && !isLinkedInTokenExpired(token) && (
      token.accessToken || token.AccessToken || token.access_token || token.idToken || token.IDToken || token.id_token
    ));
  }

  function linkedInMemberId(profile) {
    return profile?.memberId || profile?.memberID || profile?.member_id || profile?.sub || "";
  }

  function linkedInCredential() {
    const token = readStore(LINKEDIN_TOKEN_KEY);
    const memberId = linkedInMemberId(token.profile || {});
    const accessToken = token.accessToken || token.AccessToken || token.access_token || "";
    if (!hasLinkedInToken(token) || !memberId || !accessToken) return null;
    return { memberId, accessToken };
  }

  function draftFromRemote(remote) {
    const id = remote.draftId || remote.id;
    if (!id) return null;
    const image = remote.image || null;
    return {
      id,
      title: titleFromBody(remote.body || ""),
      body: remote.body || "",
      imageId: image?.imageId || null,
      imageDownloadUrl: image?.downloadUrl || null,
      imageMimeType: image?.mimeType || null,
      imageSizeBytes: image?.sizeBytes || null,
      imageChecksumSHA256: image?.checksumSHA256 || null,
      created_at: remote.createdAt || remote.created_at || nowIso(),
      updated_at: remote.updatedAt || remote.updated_at || nowIso()
    };
  }

  // remoteDrafts is the server's full list: drafts synced before but missing now were deleted elsewhere.
  function mergeDrafts(localDrafts, remoteDrafts) {
    const byId = new Map();
    const remoteIds = new Set();
    localDrafts.forEach((draft) => byId.set(draft.id, draft));
    remoteDrafts.forEach((remote) => {
      const draft = draftFromRemote(remote);
      if (!draft) return;
      remoteIds.add(draft.id);
      const existing = byId.get(draft.id);
      if (existing && new Date(existing.updated_at) >= new Date(draft.updated_at)) {
        byId.set(draft.id, { ...existing, synced: true });
        return;
      }
      const hasRemoteDownload = Boolean(draft.imageId && draft.imageDownloadUrl);
      const keepLocalImageBytes = !hasRemoteDownload && Boolean(draft.imageId) && existing?.imageId === draft.imageId;
      byId.set(draft.id, {
        ...existing,
        ...draft,
        attachment: keepLocalImageBytes ? existing?.attachment || null : null,
        imageData: keepLocalImageBytes ? existing?.imageData || null : null,
        imageFilename: keepLocalImageBytes ? existing?.imageFilename || null : null,
        synced: true
      });
    });
    byId.forEach((draft, id) => {
      if (draft.synced && !remoteIds.has(id)) byId.delete(id);
    });
    // Soft enforcement: keep all drafts regardless of limit.
    // Limit is enforced on new draft creation, not on sync/merge.
    return Array.from(byId.values())
      .sort((left, right) => new Date(right.updated_at) - new Date(left.updated_at));
  }

  function bytesToHex(buffer) {
    return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  async function sha256Hex(blob) {
    return bytesToHex(await crypto.subtle.digest("SHA-256", await blob.arrayBuffer()));
  }

  async function blobFromDraftImage(draft) {
    if (!draft?.imageData) return null;
    const type = draft.imageMimeType || "image/jpeg";
    const dataUrl = String(draft.imageData).startsWith("data:")
      ? draft.imageData
      : `data:${type};base64,${draft.imageData}`;
    return fetch(dataUrl).then((response) => response.blob());
  }

  async function refreshEntitlement(force = false) {
    const credential = linkedInCredential();
    if (!credential) return false;
    const cached = draftSyncAccess.memberId === credential.memberId &&
      draftSyncAccess.accessToken === credential.accessToken &&
      Date.now() - draftSyncAccess.checkedAt < DRAFT_SYNC_ENTITLEMENT_TTL_MS &&
      // If accessUntil is set, it must not have passed yet.
      (!draftSyncAccess.accessUntil || new Date(draftSyncAccess.accessUntil) > new Date());
    if (!force && cached) return true;
    try {
      const url = new URL(`${API_BASE_URL}/api/entitlement`);
      url.searchParams.set("memberId", credential.memberId);
      const response = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${credential.accessToken}` }
      });
      const entitlement = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(entitlement.errorDescription || "Could not check subscription.");
      const tier = String(entitlement.tier || "");
      const isPro = response.ok && entitlement.isPro === true;
      const subscriptionSource = response.ok ? String(entitlement.subscriptionSource || "") : "";
      const draftLimit = (response.ok && entitlement.draftLimit > 0) ? entitlement.draftLimit : DEFAULT_DRAFT_LIMIT;
      const accessUntil = response.ok ? String(entitlement.accessUntil || "") : "";
      draftSyncAccess = { ...credential, tier, isPro, subscriptionSource, accessUntil, draftLimit, checkedAt: Date.now() };
      updateDraftCountUI();
      updateSaveDraftButton();
      renderSyncSettings();
      renderPaddleBilling();
      return true;
    } catch (_error) {
      draftSyncAccess = { ...DEFAULT_DRAFT_SYNC_ACCESS, ...credential };
      renderPaddleBilling();
      return false;
    }
  }

  // Copy: docs/product/tiers.md "Copy — lapsed banners".
  function tierBannerContent() {
    if (!linkedInCredential()) return { message: "Connect LinkedIn to open your drafts.", action: "Connect" };
    if (draftSyncAccess.tier !== "lapsed") return null;
    const date = new Date(draftSyncAccess.accessUntil).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
    const source = draftSyncAccess.subscriptionSource;
    const ended = source && source !== "trial" ? `Your subscription ended on ${date}.` : `Your 14-day trial ended on ${date}.`;
    const hasScheduled = scheduledPosts.some((post) => new Date(post.scheduledAt) > new Date());
    return {
      message: tierNotice || `${ended} Your drafts are read-only.`,
      note: hasScheduled ? `Posts you scheduled before ${date} will still publish.` : "",
      action: "See plans"
    };
  }

  function renderTierBanner() {
    const content = tierBannerContent();
    tierBanner.hidden = !content;
    if (!content) return;
    tierBannerText.textContent = content.message;
    tierBannerNote.textContent = content.note || "";
    tierBannerNote.hidden = !content.note;
    tierBannerAction.textContent = content.action;
  }

  function showTierNotice(message) {
    tierNotice = message;
    renderTierBanner();
  }

  // Trial or pro. The server's tier is the only source; isPro is false during trial.
  function hasDraftAccess() {
    return Boolean(draftSyncAccess.tier) && draftSyncAccess.tier !== "lapsed";
  }

  // Plan sheet: the settings plan box, moved over the current view. Never navigates.
  function showSubscriptionOptions(message) {
    if (!linkedInCredential()) {
      showToast("Connect LinkedIn first.");
      return;
    }
    renderPaddleBilling();
    if (message) showTierNotice(message);
    planSheetTitle.textContent = message || "Choose a plan";
    planSheetBody.append(paddleBillingBox);
    if (!planSheet.open) planSheet.showModal();
    paddleSubscribe.focus({ preventScroll: true });
  }

  async function requireDraftAccess(needsLinkedIn = false, allowLapsed = false) {
    if (!linkedInCredential()) {
      if (!needsLinkedIn) return true;
      showView("settings");
      showToast("Connect LinkedIn first.");
      return false;
    }
    if (!await refreshEntitlement(true)) {
      showToast("Could not check your subscription. Please try again.");
      return false;
    }
    if (hasDraftAccess() || (allowLapsed && draftSyncAccess.tier === "lapsed")) return true;
    showSubscriptionOptions(needsLinkedIn ? "Publishing needs an active plan." : null);
    return false;
  }

  async function syncDrafts(upserts = [], deletes = []) {
    if (!await refreshEntitlement()) return null;
    // lapsed may push a new draft; the server refuses edits and enforces the limit.
    if (deletes.length && !hasDraftAccess()) return null;
    const credential = linkedInCredential();
    if (!credential) return null;
    const syncUpserts = [];
    for (const draft of upserts) {
      syncUpserts.push(await draftSyncPayload(draft, credential));
    }
    const url = new URL(`${API_BASE_URL}/api/drafts/sync`);
    url.searchParams.set("memberId", credential.memberId);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${credential.accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        upserts: syncUpserts,
        deletes
      })
    });
    const result = await response.json().catch(() => ({}));
    if (response.status === 402 || response.status === 403) {
      await refreshEntitlement(true);
      return null;
    }
    if (!response.ok) throw new Error(result.errorDescription || "Draft sync failed");
    return Array.isArray(result.drafts) ? result.drafts : [];
  }

  async function draftSyncPayload(draft, credential) {
    const payload = { draftId: draft.id, body: draft.body, updatedAt: draft.updated_at };
    const image = await syncDraftImage(draft, credential);
    if (image) payload.image = image;
    else if (!draft.imageId) payload.removeImage = true;
    return payload;
  }

  async function syncDraftImage(draft, credential) {
    const blob = await blobFromDraftImage(draft);
    if (!blob) return null;
    const mimeType = draft.imageMimeType || blob.type || "image/jpeg";
    const checksumSHA256 = await sha256Hex(blob);
    const sizeBytes = blob.size;
    if (
      draft.imageId &&
      draft.imageChecksumSHA256 === checksumSHA256 &&
      draft.imageSizeBytes === sizeBytes &&
      draft.imageMimeType === mimeType
    ) {
      return { imageId: draft.imageId, mimeType, sizeBytes, checksumSHA256 };
    }

    const url = new URL(`${API_BASE_URL}/api/draft-images/presign-upload`);
    url.searchParams.set("memberId", credential.memberId);
    const presignResponse = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${credential.accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ draftId: draft.id, mimeType, sizeBytes, checksumSHA256 })
    });
    const presign = await presignResponse.json().catch(() => ({}));
    if (!presignResponse.ok) throw new Error(presign.errorDescription || "Draft image sync failed");

    const uploadResponse = await fetch(presign.uploadUrl, {
      method: "PUT",
      headers: presign.headers || {},
      body: blob
    });
    if (!uploadResponse.ok) throw new Error("Draft image upload failed");

    persistDraftImageMetadata(draft.id, {
      imageId: presign.imageId,
      imageMimeType: mimeType,
      imageSizeBytes: sizeBytes,
      imageChecksumSHA256: checksumSHA256
    });
    return { imageId: presign.imageId, mimeType, sizeBytes, checksumSHA256 };
  }

  function persistDraftImageMetadata(draftId, metadata) {
    const drafts = readStore(DRAFTS_KEY);
    const index = drafts.findIndex((draft) => draft.id === draftId);
    if (index === -1) return;
    drafts[index] = { ...drafts[index], ...metadata };
    writeStore(DRAFTS_KEY, drafts);
  }

  async function syncAndMergeDrafts(upserts = [], deletes = []) {
    if (!isDraftSyncEnabled()) return;
    try {
      const remoteDrafts = await syncDrafts(upserts, deletes);
      if (!remoteDrafts) return;
      writeStore(DRAFTS_KEY, mergeDrafts(readStore(DRAFTS_KEY), remoteDrafts));
      renderDraftTable();
    } catch (error) {
      console.warn("draft sync failed, queuing for retry", error);
      if (upserts.length || deletes.length) {
        pendingMutations.push({ upserts: upserts.map((draft) => draft.id), deletes, retries: 0 });
        savePendingMutations();
      }
    }
  }

  async function drainPendingMutations() {
    if (!isDraftSyncEnabled() || !pendingMutations.length) return;
    if (!await refreshEntitlement()) return;
    const lapsed = draftSyncAccess.tier === "lapsed";
    if (!hasDraftAccess() && !lapsed) return;
    // lapsed: only new-draft upserts go out while the server total is under the limit; edits and deletes wait for a plan.
    const drafts = readStore(DRAFTS_KEY);
    if (lapsed && drafts.filter((draft) => draft.synced).length >= draftSyncAccess.draftLimit) return;
    const isNewDraft = (id) => drafts.some((draft) => draft.id === id && !draft.synced);
    const sendable = (mutation) => !lapsed || (!mutation.deletes.length && mutation.upserts.every(isNewDraft));
    const batch = pendingMutations.filter(sendable);
    if (!batch.length) return;
    pendingMutations = pendingMutations.filter((mutation) => !sendable(mutation));
    savePendingMutations();
    const allDeletes = [...new Set(batch.flatMap((mutation) => mutation.deletes))];
    const upsertIds = new Set(batch.flatMap((mutation) => mutation.upserts));
    const allUpserts = readStore(DRAFTS_KEY).filter((draft) => upsertIds.has(draft.id));
    try {
      const remoteDrafts = await syncDrafts(allUpserts, allDeletes);
      if (!remoteDrafts) return;
      writeStore(DRAFTS_KEY, mergeDrafts(readStore(DRAFTS_KEY), remoteDrafts));
      renderDraftTable();
    } catch (error) {
      console.warn("pending draft sync retry failed", error);
      for (const mutation of batch) {
        mutation.retries += 1;
        if (mutation.retries < MAX_MUTATION_RETRIES) {
          pendingMutations.push(mutation);
        }
      }
      savePendingMutations();
    }
  }

  function savePendingMutations() {
    try {
      writeStore(PENDING_MUTATIONS_KEY, pendingMutations);
    } catch (_error) {
      // Retry queue stays in memory when storage is full or blocked.
    }
  }

  async function loadRemoteDrafts() {
    if (!isDraftSyncEnabled()) return;
    if (Date.now() - lastRemoteFetchAt < 10000) return;
    lastRemoteFetchAt = Date.now();
    await syncAndMergeDrafts();
  }

  function isDraftSyncEnabled() {
    return localStorage.getItem(REDUCE_DATA_KEY) !== "true";
  }

  function hasPostScope(token) {
    const scope = String(token?.scope || "").trim();
    return !scope || scope.split(/[\s,]+/).includes("w_member_social");
  }

  function normalizeLinkedInToken(value) {
    const token = value?.token || value || {};
    const profile = token.profile || token.Profile || {};
    return {
      accessToken: token.accessToken || token.AccessToken || token.access_token || "",
      idToken: token.idToken || token.IDToken || token.id_token || "",
      tokenType: token.tokenType || token.TokenType || token.token_type || "",
      scope: token.scope || token.Scope || "",
      expiresIn: token.expiresIn || token.ExpiresIn || token.expires_in || 0,
      connectedAt: token.connectedAt || token.ConnectedAt || nowIso(),
      profile: {
        memberId: profile.memberId || profile.MemberID || profile.member_id || profile.sub || "",
        name: profile.name || profile.Name || "",
        headline: profile.headline || profile.Headline || "",
        localizedHeadline: profile.localizedHeadline || profile.LocalizedHeadline || "",
        pictureUrl: profile.pictureUrl || profile.PictureURL || profile.picture || "",
        email: profile.email || profile.Email || ""
      }
    };
  }

  function editorText() {
    return editor.value;
  }

  function cleanText() {
    return editorText()
      .replace(/\r\n?/g, "\n")
      .replace(/[\u2028\u2029]/g, "\n")
      .replace(/\u00a0/g, " ")
      .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
      .replace(/\n{4,}/g, "\n\n\n")
      .trim();
  }

  function titleFromBody(body) {
    return body.split("\n").find(Boolean)?.slice(0, 72) || "Untitled draft";
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("visible");
    toastTimer = setTimeout(() => toast.classList.remove("visible"), Math.min(6000, Math.max(1800, message.length * 60)));
  }

  function setButtonLabel(button, label) {
    const labelElement = button.querySelector(".button-label");
    if (labelElement) {
      labelElement.textContent = label;
      return;
    }
    button.textContent = label;
  }

  function renderBestPostTime() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    bestPostTime.textContent = weekdayPostTimes[today.getDay()];
    bestPostDay.textContent = today.toLocaleDateString(undefined, { weekday: "long" });
    bestPostTomorrow.textContent = `Tomorrow: ${weekdayPostTimes[tomorrow.getDay()]}`;
  }

  function escapeHtml(value) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // Convert **text** → Unicode mathematical bold. Skips chars without bold variant (%, $, etc.).
  function charToUnicodeBold(ch) {
    const cp = ch.codePointAt(0);
    // Latin uppercase
    if (cp >= 0x41 && cp <= 0x5A) return String.fromCodePoint(cp + 0x1D400 - 0x41);
    // Latin lowercase
    if (cp >= 0x61 && cp <= 0x7A) return String.fromCodePoint(cp + 0x1D41A - 0x61);
    // Digits
    if (cp >= 0x30 && cp <= 0x39) return String.fromCodePoint(cp + 0x1D7CE - 0x30);
    return null; // No bold variant
  }

  function convertBoldMarkers(text) {
    const result = [];
    let i = 0;
    while (i < text.length) {
      if (text[i] === "*" && text[i + 1] === "*") {
        i += 2; // skip opening **
        let bold = "";
        while (i < text.length && !(text[i] === "*" && text[i + 1] === "*")) {
          const bch = charToUnicodeBold(text[i]);
          bold += bch ?? text[i];
          i++;
        }
        if (bold.length > 0) result.push(bold);
        i += 2; // skip closing **
      } else {
        result.push(text[i]);
        i++;
      }
    }
    return result.join("");
  }

  function previewHtmlFromText(body) {
    return escapeHtml(body).replace(/\n/g, "<br>");
  }

  function renderPreview() {
    const body = cleanText();
    if (!body) {
      previewBody.innerHTML = "<span class=\"template-meta\">Preview appears here.</span>";
    } else {
      let html = previewHtmlFromText(body);
      previewBody.innerHTML = html;
    }
    renderPreviewImage();
    previewBody.classList.remove("collapsed");
    moreToggle.classList.remove("visible");
    moreToggle.textContent = "…more";
    window.requestAnimationFrame(() => {
      const lineHeight = Number.parseFloat(window.getComputedStyle(previewBody).lineHeight);
      const collapsedHeight = lineHeight * 5;
      if (previewBody.scrollHeight > collapsedHeight + 1) {
        previewBody.classList.add("collapsed");
        moreToggle.classList.add("visible");
      }
    });
  }

  function renderPreviewImage() {
    const file = pendingPostAttachment || postAttachment.files[0] || null;
    removeAttachment.hidden = !file;
    if (file === previewAttachmentFile) return;
    if (previewAttachmentUrl) URL.revokeObjectURL(previewAttachmentUrl);
    previewAttachmentFile = file;
    previewAttachmentUrl = file ? URL.createObjectURL(file) : null;
    previewImage.src = previewAttachmentUrl || "";
    previewImage.hidden = !previewAttachmentUrl;
  }

  function clearPostAttachment() {
    pendingPostAttachment = null;
    postAttachment.value = "";
    attachmentName.textContent = "";
    renderPreviewImage();
  }

  function setPostAttachment(file) {
    keepRemoteImage = false;
    pendingPostAttachment = file || null;
    if (file && typeof DataTransfer !== "undefined") {
      const transfer = new DataTransfer();
      transfer.items.add(file);
      postAttachment.files = transfer.files;
    } else {
      postAttachment.value = "";
    }
    attachmentName.textContent = file ? file.name : "";
    renderPreviewImage();
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function draftAttachmentPayload() {
    const file = pendingPostAttachment || postAttachment.files[0] || null;
    if (!file) return null;
    return { name: file.name, type: file.type, dataUrl: await fileToDataUrl(file) };
  }

  function imageFilenameForMime(mimeType) {
    const extension = String(mimeType || "").includes("png") ? "png" : "jpg";
    return `bloomary-linkedin-image.${extension}`;
  }

  function attachmentFromDraft(draft) {
    if (draft?.attachment?.dataUrl) return draft.attachment;
    if (!draft?.imageData) return null;
    const type = draft.imageMimeType || "image/jpeg";
    const dataUrl = String(draft.imageData).startsWith("data:")
      ? draft.imageData
      : `data:${type};base64,${draft.imageData}`;
    return { name: draft.imageFilename || "bloomary-linkedin-image.jpg", type, dataUrl };
  }

  async function restoreDraftAttachment(draft) {
    clearPostAttachment();
    keepRemoteImage = Boolean(draft?.imageId);
    const attachment = attachmentFromDraft(draft);
    if (attachment?.dataUrl) {
      const response = await fetch(attachment.dataUrl);
      const blob = await response.blob();
      setPostAttachment(new File([blob], attachment.name || imageFilenameForMime(attachment.type || blob.type), { type: attachment.type || blob.type }));
      return;
    }
    if (!draft?.imageChecksumSHA256) return;
    // Check cache first
    const cached = await _imageCacheGet(draft.imageChecksumSHA256);
    if (cached) {
      const blob = await fetch(cached).then((r) => r.blob());
      const mimeType = draft.imageMimeType || blob.type || "image/jpeg";
      setPostAttachment(new File([blob], draft.imageFilename || imageFilenameForMime(mimeType), { type: mimeType }));
      return;
    }
    if (!draft.imageDownloadUrl) return;
    try {
      const response = await fetch(draft.imageDownloadUrl);
      if (!response.ok) throw new Error("Draft image download failed");
      const blob = await response.blob();
      await _imageCachePut(draft.imageChecksumSHA256, await blobToDataUrl(blob));
      const mimeType = draft.imageMimeType || blob.type || "image/jpeg";
      setPostAttachment(new File([blob], draft.imageFilename || imageFilenameForMime(mimeType), { type: mimeType }));
    } catch (_error) {
      await _fetchFreshImageAndSet(draft);
    }
  }

  async function blobToDataUrl(blob) {
    return new Promise(ok => {
      const reader = new FileReader();
      reader.onloadend = () => ok(reader.result);
      reader.readAsDataURL(blob);
    });
  }

  async function _fetchFreshImageAndSet(draft) {
    console.log("[BLOOMARY] _fetchFreshImage:", JSON.stringify({ draftId: draft.id, imageId: draft.imageId, memberId: draftSyncAccess.memberId, hasToken: !!draftSyncAccess.accessToken }));
    if (!draftSyncAccess.memberId || !draft.imageId || !draftSyncAccess.accessToken) { showToast("Draft image could not be loaded"); return; }
    try {
      const url = new URL(`${API_BASE_URL}/api/draft-images/presign-download`);
      url.searchParams.set("memberId", draftSyncAccess.memberId);
      const resp = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${draftSyncAccess.accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId: draft.id, imageId: draft.imageId })
      });
      if (!resp.ok) { showToast("Draft image could not be loaded"); return; }
      const body = await resp.json().catch(() => ({}));
      if (!body.downloadUrl) { showToast("Draft image could not be loaded"); return; }
      const fres = await fetch(body.downloadUrl);
      console.log('[BLOOMARY] presign-download:', fres.status); if (!fres.ok) { showToast('Draft image could not be loaded'); return; }
      const blob = await fres.blob();
      await _imageCachePut(draft.imageChecksumSHA256, await blobToDataUrl(blob));
      const mimeType = draft.imageMimeType || blob.type || "image/jpeg";
      setPostAttachment(new File([blob], draft.imageFilename || imageFilenameForMime(mimeType), { type: mimeType }));
    } catch (_) { showToast("Draft image could not be loaded"); }
  }

  function isEditorDirty() {
    const body = cleanText();
    const saved = readStore(DRAFTS_KEY).find((draft) => draft.id === activeDraftId);
    return Boolean(body) && body !== (saved?.body || "");
  }

  function confirmDiscardEditor() {
    return !isEditorDirty() || window.confirm("Discard unsaved changes in the editor?");
  }

  function newEditorState() {
    activeDraftId = null;
    clearPostAttachment();
    keepRemoteImage = false;
    editor.value = "";
    renderPreview();
    updateSaveDraftButton();
  }

  function initialsFromName(name) {
    const parts = String(name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2);
    return parts.map((part) => part[0]).join("").toUpperCase() || "in";
  }

  function renderPreviewProfile() {
    const token = readStore(LINKEDIN_TOKEN_KEY);
    const profile = token.profile || {};
    const name = profile.name || "LinkedIn member";
    const headline = profile.localizedHeadline || profile.headline || "";

    previewName.textContent = name;
    previewHeadline.textContent = headline;
    previewHeadline.hidden = !headline;

    if (profile.pictureUrl) {
      previewAvatar.textContent = "";
      previewAvatar.style.backgroundImage = `url("${String(profile.pictureUrl).replace(/"/g, "%22")}")`;
      previewAvatar.classList.add("has-image");
      previewAvatar.setAttribute("aria-label", name);
      return;
    }

    previewAvatar.textContent = initialsFromName(name);
    previewAvatar.style.backgroundImage = "";
    previewAvatar.classList.remove("has-image");
    previewAvatar.setAttribute("aria-label", name);
  }

  function placeCursorAtEnd() {
    editor.focus();
    editor.setSelectionRange(editor.value.length, editor.value.length);
  }

  function selectionOffsets() {
    const length = editor.value.length;
    return {
      start: Number.isInteger(editor.selectionStart) ? editor.selectionStart : length,
      end: Number.isInteger(editor.selectionEnd) ? editor.selectionEnd : length
    };
  }

  function rememberEditorSelection() {
    savedEditorSelection = selectionOffsets();
  }

  function setSelectionOffsets(start, end = start) {
    editor.focus();
    editor.setSelectionRange(start, end);
  }

  function replaceEditorText(start, end, value) {
    const text = editor.value;
    editor.value = text.slice(0, start) + value + text.slice(end);
    setSelectionOffsets(start + value.length);
    renderPreview();
  }

  function plainSelectedText() {
    const { start, end } = selectionOffsets();
    return { start, end, text: editor.value.slice(start, end) };
  }

  function prefixSelectedLines(prefix) {
    const { start, end } = selectionOffsets();
    const text = editor.value;
    const lineStart = text.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
    const selectedEnd = end > start ? end - 1 : end;
    let lineEnd = text.indexOf("\n", selectedEnd);
    if (lineEnd === -1) lineEnd = text.length;
    const lines = text.slice(lineStart, lineEnd).split("\n");
    let item = 0;
    const replacement = lines.map((line) => {
      if (!line.trim()) return line;
      const body = line.replace(/^\s*(?:[-*•]\s+|\d+[.)]\s+)/, "");
      return prefix(item++) + body;
    }).join("\n");
    replaceEditorText(lineStart, lineEnd, replacement);
    setSelectionOffsets(lineStart, lineStart + replacement.length);
  }

  function clearTextFormatting(value) {
    const plain = value.replace(/./gu, (char) => {
      const code = char.codePointAt(0);
      if (code >= 0x1d400 && code <= 0x1d419) return String.fromCodePoint(65 + code - 0x1d400);
      if (code >= 0x1d41a && code <= 0x1d433) return String.fromCodePoint(97 + code - 0x1d41a);
      if (code >= 0x1d7ce && code <= 0x1d7d7) return String.fromCodePoint(48 + code - 0x1d7ce);
      if (code >= 0x1d434 && code <= 0x1d44d) return String.fromCodePoint(65 + code - 0x1d434);
      if (code === 0x210e) return "h";
      if (code >= 0x1d44e && code <= 0x1d467) return String.fromCodePoint(97 + code - 0x1d44e);
      if (code >= 0x1d670 && code <= 0x1d689) return String.fromCodePoint(65 + code - 0x1d670);
      if (code >= 0x1d68a && code <= 0x1d6a3) return String.fromCodePoint(97 + code - 0x1d68a);
      if (code >= 0x1d7f6 && code <= 0x1d7ff) return String.fromCodePoint(48 + code - 0x1d7f6);
      return char;
    });
    return plain
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/__([^_]+)__/g, "$1")
      .replace(/_([^_]+)_/g, "$1")
      .replace(/~~([^~]+)~~/g, "$1")
      .replace(/`/g, "")
      .normalize("NFD")
      .replace(/[\u0332\u0336]/g, "");
  }

  function unicodeBold(value) {
    return value.replace(/[A-Za-z0-9]/g, (char) => {
      const code = char.codePointAt(0);
      if (code >= 65 && code <= 90) return String.fromCodePoint(0x1d400 + code - 65);
      if (code >= 97 && code <= 122) return String.fromCodePoint(0x1d41a + code - 97);
      return String.fromCodePoint(0x1d7ce + code - 48);
    });
  }

  function unicodeItalic(value) {
    const italicLowerH = 0x210e;
    return value.replace(/[A-Za-z]/g, (char) => {
      const code = char.codePointAt(0);
      if (code >= 65 && code <= 90) return String.fromCodePoint(0x1d434 + code - 65);
      if (code === 104) return String.fromCodePoint(italicLowerH);
      return String.fromCodePoint(0x1d44e + code - 97);
    });
  }

  function unicodeMonospace(value) {
    return value.replace(/[A-Za-z0-9]/g, (char) => {
      const code = char.codePointAt(0);
      if (code >= 65 && code <= 90) return String.fromCodePoint(0x1d670 + code - 65);
      if (code >= 97 && code <= 122) return String.fromCodePoint(0x1d68a + code - 97);
      return String.fromCodePoint(0x1d7f6 + code - 48);
    });
  }

  function addCombiningMark(value, mark) {
    return [...value].map((char) => char === "\n" ? char : `${char}${mark}`).join("");
  }

  function transformSelection(transform) {
    const selection = plainSelectedText();
    if (!selection.text) return;
    replaceEditorText(selection.start, selection.end, transform(selection.text));
  }

  function runInlineCommand(command) {
    if (command === "bold") transformSelection(unicodeBold);
    if (command === "italic") transformSelection(unicodeItalic);
    if (command === "underline") transformSelection((value) => addCombiningMark(value, "\u0332"));
    if (command === "strikeThrough") transformSelection((value) => addCombiningMark(value, "\u0336"));
  }

  function runTextCommand(command) {
    const selection = plainSelectedText();
    if (command === "code") {
      if (!selection.text) return;
      replaceEditorText(selection.start, selection.end, unicodeMonospace(selection.text));
      return;
    }
    if (command === "clear") {
      if (selection.text) {
        replaceEditorText(selection.start, selection.end, clearTextFormatting(selection.text));
      } else {
        replaceEditorText(0, editor.value.length, clearTextFormatting(editor.value));
      }
      renderPreview();
      return;
    }
    if (command === "bullets") {
      prefixSelectedLines(() => "• ");
      return;
    }
    if (command === "numbered") {
      prefixSelectedLines((index) => `${index + 1}. `);
    }
  }

  function insertEmoji(emoji) {
    let { start, end } = savedEditorSelection || selectionOffsets();
    const length = editor.value.length;
    if (start === 0 && end === length) {
      start = length;
      end = length;
    }
    replaceEditorText(start, end, emoji);
    savedEditorSelection = selectionOffsets();
    emojiModal.hidden = true;
  }

  function renderEmojiPicker() {
    emojiPickerGrid.innerHTML = "";
    emojis.forEach((emoji) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = emoji;
      button.setAttribute("aria-label", `Insert ${emoji}`);
      button.addEventListener("mousedown", (event) => event.preventDefault());
      button.addEventListener("click", () => insertEmoji(emoji));
      emojiPickerGrid.append(button);
    });
  }

  async function saveDraft(options = {}) {
    if (!await requireDraftAccess(false, true)) return false;
    const shouldSync = options.sync !== false;
    const body = cleanText();
    const attachment = await draftAttachmentPayload();
    if (!body && !attachment) {
      showToast("Draft is empty");
      return false;
    }
    const drafts = readStore(DRAFTS_KEY);
    const timestamp = nowIso();
    const imageData = attachment?.dataUrl ? attachment.dataUrl.split(",")[1] : null;
    const activeIndex = drafts.findIndex((draft) => draft.id === activeDraftId);
    if (activeIndex !== -1 && draftSyncAccess.tier === "lapsed") {
      showSubscriptionOptions(null);
      return false;
    }
    if (activeIndex === -1 && drafts.length >= draftSyncAccess.draftLimit) {
      if (hasDraftAccess()) showToast(`Draft limit reached. You have ${drafts.length}/${draftSyncAccess.draftLimit} drafts.`);
      else showSubscriptionOptions("You've reached 5 drafts without a plan.");
      return false;
    }
    if (activeIndex !== -1) {
      const existing = drafts[activeIndex];
      const keepImage = !attachment && keepRemoteImage;
      drafts[activeIndex] = {
        ...existing,
        title: titleFromBody(body),
        body,
        attachment: keepImage ? existing.attachment || null : attachment,
        imageData: keepImage ? existing.imageData || null : imageData,
        imageFilename: keepImage ? existing.imageFilename || null : attachment?.name || null,
        imageMimeType: keepImage ? existing.imageMimeType || null : attachment?.type || null,
        ...(attachment || keepImage ? {} : { imageId: null, imageDownloadUrl: null, imageChecksumSHA256: null, imageSizeBytes: null }),
        updated_at: timestamp
      };
      writeStore(DRAFTS_KEY, drafts);
      renderDraftTable();
      if (shouldSync) await syncAndMergeDrafts([drafts[activeIndex]]);
      showToast("Draft updated");
      return true;
    }
    activeDraftId = crypto.randomUUID();
    drafts.unshift({
      id: activeDraftId,
      title: titleFromBody(body),
      body,
      attachment,
      imageData,
      imageFilename: attachment?.name || null,
      imageMimeType: attachment?.type || null,
      created_at: timestamp,
      updated_at: timestamp
    });
    writeStore(DRAFTS_KEY, drafts);
    renderDraftTable();
    if (shouldSync) await syncAndMergeDrafts([drafts[0]]);
    if (draftSyncAccess.tier === "lapsed") showTierNotice("Saved. Without a plan, drafts can't be edited, deleted, or published.");
    else showToast("Draft saved");
    return true;
  }

  function defaultScheduleDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const [hour, minute] = weekdayPostTimes[tomorrow.getDay()].split("-")[0].split(":").map(Number);
    tomorrow.setHours(hour, minute, 0, 0);
    return tomorrow;
  }

  function resetScheduleRange() {
    const earliest = new Date(Date.now() + SCHEDULE_MIN_AHEAD_MS);
    const latest = new Date(Date.now() + SCHEDULE_MAX_AHEAD_DAYS * 24 * 60 * 60_000);
    scheduleAt.min = localDateTimeValue(earliest);
    scheduleAt.max = localDateTimeValue(latest);
    if (!scheduleAt.value) scheduleAt.value = localDateTimeValue(defaultScheduleDate());
  }

  async function scheduleCurrentDraft() {
    const credential = linkedInCredential();
    if (!credential) {
      showToast("Connect LinkedIn first");
      showView("settings");
      return;
    }
    if (!await requireDraftAccess(true)) return;
    resetScheduleRange();
    const date = new Date(scheduleAt.value);
    const earliest = Date.now() + SCHEDULE_MIN_AHEAD_MS;
    const latest = Date.now() + SCHEDULE_MAX_AHEAD_DAYS * 24 * 60 * 60_000;
    if (!Number.isFinite(date.getTime()) || date.getTime() < earliest || date.getTime() > latest) {
      showToast(`Choose a time between 5 minutes and ${SCHEDULE_MAX_AHEAD_DAYS} days from now.`);
      return;
    }
    schedulePost.disabled = true;
    try {
      if (!await saveDraft({ sync: false })) return;
      const draft = readStore(DRAFTS_KEY).find((item) => item.id === activeDraftId);
      if (!draft) throw new Error("Save this draft before scheduling.");
      const remoteDrafts = await syncDrafts([draft], []);
      if (!remoteDrafts) throw new Error("Draft sync is required for scheduling.");
      writeStore(DRAFTS_KEY, mergeDrafts(readStore(DRAFTS_KEY), remoteDrafts));
      await rescheduleDraft(activeDraftId, date);
      document.getElementById("scheduleMenu").open = false;
      showToast(`Scheduled for ${date.toLocaleString()}.`);
      showView("drafts");
    } catch (error) {
      showToast(error.message);
    } finally {
      schedulePost.disabled = false;
    }
  }

  async function openDraft(draft) {
    if (!await requireDraftAccess(false, true)) return;
    activeDraftId = draft.id;
    editor.value = draft.body;
    await restoreDraftAttachment(draft);
    placeCursorAtEnd();
    renderPreview();
    updateSaveDraftButton();
    showView("editor");
  }

  function openImageEditor() {
    resetImageEditor();
    imageEditorModal.hidden = false;
    renderImageEditor();
  }

  function closeImageEditor() {
    imageEditorModal.hidden = true;
  }

  function resetImageEditor() {
    imageEditorImage = null;
    imageEditorDrag = null;
    imageEditorText.value = "";
    imageEditorFile.value = "";
    imageEditorDrop.hidden = false;
    imageEditorStage.hidden = true;
    imageEditorState.textX = 0.5;
    imageEditorState.textY = 0.45;
    imageEditorState.textScale = 0.09;
    imageEditorState.styleIndex = 0;
    imageEditorState.alignIndex = 0;
  }

  function loadImageEditorFile(file) {
    if (!file || !file.type.startsWith("image/")) {
      showToast("Choose an image");
      return;
    }
    const image = new Image();
    const imageUrl = URL.createObjectURL(file);
    image.onerror = () => {
      URL.revokeObjectURL(imageUrl);
      showToast("This image format isn't supported. Use JPEG or PNG.");
    };
    image.onload = () => {
      URL.revokeObjectURL(imageUrl);
      imageEditorImage = image;
      imageEditorDrop.hidden = true;
      imageEditorStage.hidden = false;
      renderImageEditor();
      imageEditorText.focus();
    };
    image.src = imageUrl;
  }

  function renderImageEditor() {
    renderImageEditorCanvas(false);
    const style = imageEditorStyles[imageEditorState.styleIndex];
    const alignment = imageEditorAlignments[imageEditorState.alignIndex];
    imageEditorText.style.left = `${Math.min(Math.max(imageEditorState.textX * 100 - 41, 0), 18)}%`;
    imageEditorText.style.top = `${Math.min(Math.max(imageEditorState.textY * 100 - 4, 0), 92)}%`;
    imageEditorText.style.fontSize = `${Math.max(16, imageEditorState.textScale * imageEditorStage.clientWidth)}px`;
    imageEditorText.style.color = style.foreground;
    imageEditorText.style.background = style.background;
    imageEditorText.style.textAlign = alignment;
    imageEditorStyle.style.color = style.foreground;
    imageEditorStyle.style.background = style.background === "transparent" ? "rgba(255, 255, 255, 0.12)" : style.background;
    imageEditorAlign.textContent = alignment[0].toUpperCase() + alignment.slice(1);
    imageEditorClear.disabled = !imageEditorText.value.trim();
    imageEditorDone.disabled = !imageEditorImage;
  }

  function renderImageEditorCanvas(includeText = true) {
    const canvas = imageEditorCanvas;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (!imageEditorImage) return;

    const scale = Math.max(canvas.width / imageEditorImage.width, canvas.height / imageEditorImage.height);
    const width = imageEditorImage.width * scale;
    const height = imageEditorImage.height * scale;
    ctx.drawImage(imageEditorImage, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);

    imageEditorCaptionTrimmed = false;
    if (!includeText) return;
    const text = imageEditorText.value.trim();
    if (!text) return;
    const style = imageEditorStyles[imageEditorState.styleIndex];
    const alignment = imageEditorAlignments[imageEditorState.alignIndex];
    const fontSize = imageEditorState.textScale * canvas.width;
    const lineHeight = fontSize * 1.14;
    const boxWidth = canvas.width * 0.82;
    const allLines = wrappedCanvasLines(ctx, text, boxWidth - 20, fontSize);
    imageEditorCaptionTrimmed = allLines.length > 4;
    const lines = allLines.slice(0, 4);
    const boxHeight = lines.length * lineHeight + 12;
    const centerX = imageEditorState.textX * canvas.width;
    const centerY = imageEditorState.textY * canvas.height;

    ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif`;
    if (style.background !== "transparent") {
      ctx.fillStyle = style.background;
      roundRect(ctx, centerX - boxWidth / 2, centerY - boxHeight / 2, boxWidth, boxHeight, 12);
      ctx.fill();
    }
    ctx.fillStyle = style.foreground;
    ctx.textBaseline = "middle";
    ctx.textAlign = alignment;
    const textX = alignment === "left" ? centerX - boxWidth / 2 + 10 : alignment === "right" ? centerX + boxWidth / 2 - 10 : centerX;
    lines.forEach((line, index) => {
      const y = centerY - ((lines.length - 1) * lineHeight) / 2 + index * lineHeight;
      ctx.fillText(line, textX, y);
    });
  }

  function wrappedCanvasLines(ctx, text, maxWidth, fontSize) {
    ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif`;
    const lines = [];
    text.split("\n").forEach((paragraph) => {
      let line = "";
      paragraph.split(/\s+/).filter(Boolean).forEach((word) => {
        const next = line ? `${line} ${word}` : word;
        if (ctx.measureText(next).width <= maxWidth || !line) {
          line = next;
        } else {
          lines.push(line);
          line = word;
        }
      });
      if (line) lines.push(line);
    });
    return lines;
  }

  function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
  }

  function setImageEditorPosition(event) {
    const rect = imageEditorStage.getBoundingClientRect();
    imageEditorState.textX = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
    imageEditorState.textY = Math.min(Math.max((event.clientY - rect.top) / rect.height, 0), 1);
    renderImageEditor();
  }

  function finishImageEditor() {
    if (!imageEditorImage) return;
    renderImageEditorCanvas();
    imageEditorCanvas.toBlob((blob) => {
      if (!blob) {
        showToast("Image export failed");
        return;
      }
      const file = new File([blob], "bloomary-linkedin-image.jpg", { type: "image/jpeg" });
      setPostAttachment(file);
      closeImageEditor();
      showToast(imageEditorCaptionTrimmed ? "Image attached. Caption was cut to 4 lines." : "Image attached");
    }, "image/jpeg", 1);
  }

  function renderDraftTable() {
    const query = draftFilter.value.trim().toLowerCase();
    const drafts = readStore(DRAFTS_KEY).filter((draft) => {
      const matchesText = !query || `${draft.title}\n${draft.body}`.toLowerCase().includes(query);
      const scheduled = scheduledPosts.find((post) => post.draftId === draft.id);
      return matchesText && (draftScope !== "scheduled" || Boolean(scheduled));
    });
    draftRows.innerHTML = "";
    draftEmpty.textContent = draftScope === "scheduled" ? "No scheduled drafts" : "No drafts yet";
    draftEmpty.hidden = drafts.length > 0;
    updateSaveDraftButton();
    drafts.forEach((draft) => {
      const row = document.createElement("article");
      row.className = "draft-row";
      row.tabIndex = 0;
      row.addEventListener("click", () => openDraft(draft));
      row.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openDraft(draft);
        }
      });
      const excerpt = draft.body.replace(/\s+/g, " ").trim().slice(0, 150);
      row.innerHTML = `
        <div class="draft-row-copy">
          <h2>${escapeHtml(draft.title)}</h2>
          <p>${escapeHtml(excerpt)}${draft.body.length > 150 ? "…" : ""}</p>
          <div class="draft-row-meta">Updated ${escapeHtml(formatDate(draft.updated_at))}<span class="draft-schedule-meta"></span></div>
        </div>
      `;
      const actions = document.createElement("div");
      actions.className = "draft-actions";
      actions.addEventListener("click", (event) => event.stopPropagation());
      const scheduleButton = document.createElement("button");
      scheduleButton.type = "button";
      scheduleButton.className = "draft-icon-action";
      scheduleButton.title = "Schedule";
      scheduleButton.setAttribute("aria-label", "Schedule draft");
      scheduleButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/><circle cx="12" cy="15" r="2"/></svg>';
      scheduleButton.addEventListener("click", async (event) => {
        event.stopPropagation();
        if (!await requireDraftAccess(true)) return;
        openDraftScheduleDialog(draft);
      });
      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "draft-icon-action danger";
      deleteButton.title = "Delete";
      deleteButton.setAttribute("aria-label", "Delete draft");
      deleteButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6"/></svg>';
      deleteButton.addEventListener("click", async (event) => {
        event.stopPropagation();
        if (!await requireDraftAccess()) return;
        if (!window.confirm(`Delete "${draft.title}"? This can't be undone.`)) return;
        if (activeDraftId === draft.id) activeDraftId = null;
        writeStore(DRAFTS_KEY, readStore(DRAFTS_KEY).filter((item) => item.id !== draft.id));
        renderDraftTable();
        syncAndMergeDrafts([], [draft.id]);
      });
      actions.append(scheduleButton, deleteButton);
      const schedule = scheduledPosts.find((post) => post.draftId === draft.id);
      const scheduleMeta = row.querySelector(".draft-schedule-meta");
      if (schedule) {
        scheduleMeta.textContent = ` · Scheduled ${new Date(schedule.scheduledAt).toLocaleString()}`;
      }
      row.append(actions);
      draftRows.append(row);
    });
  }

  function localDateTimeValue(date) {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return local.toISOString().slice(0, 16);
  }

  function openDraftScheduleDialog(draft) {
    draftToSchedule = draft;
    const earliestDate = new Date(Date.now() + SCHEDULE_MIN_AHEAD_MS);
    const latestDate = new Date(Date.now() + SCHEDULE_MAX_AHEAD_DAYS * 24 * 60 * 60_000);
    const scheduled = scheduledPosts.find((post) => post.draftId === draft.id);
    const suggestedDate = scheduled ? new Date(scheduled.scheduledAt) : defaultScheduleDate();
    const date = new Date(Math.min(latestDate, Math.max(Math.ceil(earliestDate.getTime() / 60_000) * 60_000, suggestedDate)));
    draftScheduleTitle.textContent = draft.title;
    draftScheduleAt.min = localDateTimeValue(earliestDate);
    draftScheduleAt.max = localDateTimeValue(latestDate);
    draftScheduleAt.value = localDateTimeValue(date);
    draftScheduleDialog.showModal();
    draftScheduleAt.focus();
  }

  function closeDraftScheduleDialog() {
    draftToSchedule = null;
    draftScheduleDialog.close();
  }

  async function confirmDraftSchedule() {
    if (!draftToSchedule) return;
    if (!await requireDraftAccess(true)) {
      closeDraftScheduleDialog();
      return;
    }
    const date = new Date(draftScheduleAt.value);
    const earliest = Date.now() + SCHEDULE_MIN_AHEAD_MS;
    const latest = Date.now() + SCHEDULE_MAX_AHEAD_DAYS * 24 * 60 * 60_000;
    if (!Number.isFinite(date.getTime()) || date.getTime() < earliest || date.getTime() > latest) {
      showToast(`Choose a time between 5 minutes and ${SCHEDULE_MAX_AHEAD_DAYS} days from now.`);
      return;
    }
    draftScheduleConfirm.disabled = true;
    try {
      const draft = draftToSchedule;
      const remoteDrafts = await syncDrafts([draft], []);
      if (!remoteDrafts) throw new Error("Draft sync is required for scheduling.");
      writeStore(DRAFTS_KEY, mergeDrafts(readStore(DRAFTS_KEY), remoteDrafts));
      await rescheduleDraft(draft.id, date);
      closeDraftScheduleDialog();
      showToast(`Scheduled for ${date.toLocaleString()}.`);
    } catch (error) {
      showToast(error.message);
    } finally {
      draftScheduleConfirm.disabled = false;
    }
  }

  async function refreshScheduledPosts() {
    const credential = linkedInCredential();
    if (!credential) {
      scheduledPosts = [];
      renderDraftTable();
      return;
    }
    const url = new URL(`${API_BASE_URL}/api/linkedin/schedules`);
    url.searchParams.set("memberId", credential.memberId);
    const response = await fetch(url, { headers: { Authorization: `Bearer ${credential.accessToken}` } });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.errorDescription || "Scheduled posts could not be loaded.");
    scheduledPosts = Array.isArray(result.schedules) ? result.schedules : [];
    renderDraftTable();
    renderTierBanner();
  }

  async function rescheduleDraft(draftId, date) {
    const credential = linkedInCredential();
    if (!credential) throw new Error("Connect LinkedIn first.");
    const response = await fetch(`${API_BASE_URL}/api/linkedin/schedule?memberId=${encodeURIComponent(credential.memberId)}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${credential.accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ draftId, scheduledAt: date.toISOString() })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.errorDescription || "Schedule could not be updated.");
    await refreshScheduledPosts();
  }

  function viewFromPath() {
    return Object.entries(VIEW_PATHS).find(([, path]) => path === window.location.pathname)?.[0] || "editor";
  }

  function showView(name, { updateHistory = true, replaceHistory = false } = {}) {
    if (!VIEW_PATHS[name]) name = "editor";
    tierNotice = null;
    renderTierBanner();
    editorView.hidden = name !== "editor";
    draftsView.hidden = name !== "drafts";
    insightsView.hidden = name !== "insights";
    settingsView.hidden = name !== "settings";
    topActions.hidden = name !== "editor";
    postTimeCard.hidden = !["editor", "insights"].includes(name);
    navEditor.classList.toggle("is-active", name === "editor");
    navDrafts.classList.toggle("is-active", name === "drafts");
    navInsights.classList.toggle("is-active", name === "insights");
    navSettings.classList.toggle("is-active", name === "settings");
    if (name === "drafts") {
      renderDraftTable();
      refreshScheduledPosts().catch((error) => showToast(error.message));
    }
    if (name === "settings") {
      renderLinkedInSettings();
      refreshLinkedInProfile();
    }
    if (name === "settings") renderAISettings();
    if (name === "settings") renderSyncSettings();
    if (updateHistory && window.location.pathname !== VIEW_PATHS[name]) {
      window.history[replaceHistory ? "replaceState" : "pushState"]({ view: name }, "", VIEW_PATHS[name]);
    }
  }

  async function naturalizeDraft() {
    const body = cleanText();
    const apiKey = readGeminiAPIKey();
    if (!body) {
      showToast("Post is empty");
      return;
    }
    if (!apiKey) {
      showToast("Add Gemini API key first");
      showView("settings");
      geminiAPIKey.focus();
      return;
    }
    naturalizeEnglish.disabled = true;
    setButtonLabel(naturalizeEnglish, "Improving post...");
    const controller = new AbortController();
    const timeoutID = window.setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(GEMINI_INTERACTIONS_URL, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "x-goog-api-key": apiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: GEMINI_MODEL,
          store: false,
          system_instruction: naturalizePrompt(readPostLanguage()),
          input: `Edit this LinkedIn draft:\n\n${body}`,
          generation_config: { temperature: 0.2 }
        })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const keyHint = [400, 401, 403].includes(response.status)
          ? " Check that your saved Gemini API key is still active and current. If it was rotated or deleted, update it in Settings."
          : "";
        throw new Error((result.error?.message || "AI edit failed") + keyHint);
      }
      const rawText = (Array.isArray(result.steps) ? result.steps : [])
        .filter((step) => step?.type === "model_output")
        .flatMap((step) => Array.isArray(step.content) ? step.content : [])
        .filter((part) => part?.type === "text" && typeof part.text === "string")
        .map((part) => part.text)
        .join("")
        .trim();
      if (!rawText) throw new Error("AI edit failed");
      const text = convertBoldMarkers(rawText);
      editor.value = text;
      renderPreview();
      showToast("Post improved");
    } catch (error) {
      showToast(error.name === "AbortError" ? "AI edit timed out" : error.message);
    } finally {
      window.clearTimeout(timeoutID);
      naturalizeEnglish.disabled = false;
      setButtonLabel(naturalizeEnglish, "Improve post with AI");
    }
  }

  async function sendFeedbackEmail(event) {
    event.preventDefault();
    const profile = readStore(LINKEDIN_TOKEN_KEY).profile || {};
    const message = feedbackMessage.value.trim();
    if (!message) {
      showToast("Message is empty");
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name || "",
          linkedInId: linkedInMemberId(profile),
          email: profile.email || "",
          message
        })
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.errorDescription || "Feedback send failed");
      }
      feedbackMessage.value = "";
      feedbackForm.hidden = true;
      showToast("Feedback sent");
    } catch (error) {
      showToast(error.message);
    }
  }

  async function disconnectLinkedIn() {
    const token = readStore(LINKEDIN_TOKEN_KEY);
    const linkedInId = linkedInMemberId(token.profile || {});
    let serverDisconnected = !linkedInId;
    try {
      if (linkedInId) {
        const response = await fetch(`${API_BASE_URL}/api/linkedin/disconnect`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token.accessToken || ""}`, "Content-Type": "application/json" },
          body: JSON.stringify({ linkedInId })
        });
        serverDisconnected = response.ok;
      }
    } catch (_error) {
      serverDisconnected = false;
    } finally {
      removeStore(LINKEDIN_TOKEN_KEY);
      draftSyncAccess = { ...DEFAULT_DRAFT_SYNC_ACCESS };
      renderLinkedInSettings();
      renderSyncSettings();
      renderPaddleBilling();
      showToast(serverDisconnected
        ? "LinkedIn disconnected"
        : "Disconnected in this browser. Server disconnect failed, try again after reconnecting.");
    }
  }

  async function publishToLinkedIn() {
    if (!LINKEDIN_PUBLISHING_ENABLED) {
      publishLinkedIn.disabled = true;
      showToast("LinkedIn publishing is pending API approval.");
      return;
    }

    const token = readStore(LINKEDIN_TOKEN_KEY);
    const profile = token.profile || {};
    const memberId = linkedInMemberId(profile);
    const body = cleanText();
    const file = pendingPostAttachment || postAttachment.files[0];
    if (!hasLinkedInToken(token) || !memberId) {
      showToast("Connect LinkedIn first");
      showView("settings");
      return;
    }
    if (!hasPostScope(token)) {
      showToast("Reconnect LinkedIn for posting");
      showView("settings");
      return;
    }
    if (!await requireDraftAccess(true)) return;
    if (!body && !file) {
      showToast("Post is empty");
      return;
    }
    const form = new FormData();
    form.set("accessToken", token.accessToken);
    form.set("memberId", memberId);
    form.set("commentary", body);
    if (file) form.set("attachment", file);
    publishLinkedIn.disabled = true;
    setButtonLabel(publishLinkedIn, "Posting...");
    try {
      const response = await fetch(`${API_BASE_URL}/api/linkedin/post`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token.accessToken}` },
        body: form
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.errorDescription || "LinkedIn post failed");
      showToast("Posted.");
    } catch (error) {
      showToast(error.message);
    } finally {
      publishLinkedIn.disabled = !LINKEDIN_PUBLISHING_ENABLED;
      setButtonLabel(publishLinkedIn, "Post to LinkedIn");
    }
  }

  let profileRefreshInFlight = false;
  let lastProfileRefreshAt = 0;

  async function refreshLinkedInProfile() {
    const credential = linkedInCredential();
    if (!credential || profileRefreshInFlight || Date.now() - lastProfileRefreshAt < 60000) return;
    profileRefreshInFlight = true;
    lastProfileRefreshAt = Date.now();
    try {
      const response = await fetch(`${API_BASE_URL}/api/linkedin/profile?memberId=${encodeURIComponent(credential.memberId)}`, {
        headers: { Authorization: `Bearer ${credential.accessToken}` }
      });
      const profile = await response.json();
      // Ignore responses from a session that disconnected or changed meanwhile.
      const current = linkedInCredential();
      if (!current || current.memberId !== credential.memberId || current.accessToken !== credential.accessToken) return;
      if (response.status === 401) {
        removeStore(LINKEDIN_TOKEN_KEY);
        renderLinkedInSettings();
        renderSyncSettings();
        showToast("LinkedIn session expired. Reconnect LinkedIn.");
        return;
      }
      if (!response.ok) throw new Error(profile.errorDescription || "Could not refresh LinkedIn profile.");
      const token = readStore(LINKEDIN_TOKEN_KEY);
      writeStore(LINKEDIN_TOKEN_KEY, { ...token, profile: { ...token.profile, ...profile, pictureUrl: profile.pictureUrl || "" } });
      renderLinkedInSettings();
    } catch (error) {
      showToast(error.message);
    } finally {
      profileRefreshInFlight = false;
    }
  }

  function renderLinkedInSettings() {
    const token = readStore(LINKEDIN_TOKEN_KEY);
    const profile = token.profile || {};
    const isConnected = hasLinkedInToken(token);
    renderPreviewProfile();
    linkedinStatus.textContent = "LinkedIn · Connected";
    linkedinConnect.hidden = isConnected;
    linkedinConnect.disabled = linkedInAuthInFlight;
    linkedinDisconnect.hidden = !isConnected;
    linkedinDisconnect.disabled = false;
    linkedinDisconnectedStatus.hidden = isConnected;
    dangerZone.hidden = !isConnected;
    deleteAccount.disabled = !isConnected;
    exportDrafts.disabled = !isConnected;
    accountDeletionStatus.textContent = isConnected
      ? "Delete connected Bloomary account data and clear this browser."
      : "Connect LinkedIn to delete connected Bloomary account data.";
    linkedinProfileCard.hidden = !isConnected;
    if (!isConnected) return;
    linkedinProfilePicture.src = profile.pictureUrl || "";
    linkedinProfilePicture.hidden = !profile.pictureUrl;
    linkedinProfileName.textContent = profile.name || "LinkedIn member";
    linkedinProfileEmail.textContent = profile.email || "";
    updateLinkedInTokenExpiry();
  }

  function renderSyncSettings() {
    if (!syncSettingsBox || !syncEnabledToggle) return;
    syncSettingsBox.hidden = !linkedInCredential();
    if (!syncSettingsBox.hidden) {
      syncEnabledToggle.checked = localStorage.getItem(REDUCE_DATA_KEY) !== "true";
      syncToggleStatus.textContent = syncEnabledToggle.checked ? "On" : "Off";
    }
  }

  function renderPaddleBilling() {
    renderTierBanner();
    if (!paddleBillingBox || !paddleSubscribe || !paddleSubscribeYearly) return;
    const credential = linkedInCredential();
    const enabled = Boolean(CONFIG.paddleClientToken && CONFIG.paddlePriceProMonthly && window.Paddle);
    paddleBillingBox.hidden = !credential;
    paddleSubscribe.hidden = draftSyncAccess.isPro;
    paddleSubscribeYearly.hidden = draftSyncAccess.isPro;
    paddleManage.hidden = !draftSyncAccess.isPro;
    trialProgress.parentElement.hidden = draftSyncAccess.isPro;
    paddleBillingTitle.textContent = { trial: "Trial", pro: "Pro", lapsed: "No active plan" }[draftSyncAccess.tier] || "Your plan";
    if (draftSyncAccess.isPro) {
      const isAppleSubscription = draftSyncAccess.subscriptionSource === "apple";
      paddleBillingStatus.textContent = isAppleSubscription ? "Active · App Store" : "Active";
      paddleManage.textContent = isAppleSubscription ? "Manage in App Store" : "Manage subscription";
      return;
    }
    paddleSubscribe.disabled = !enabled;
    paddleSubscribeYearly.disabled = !enabled || !CONFIG.paddlePriceProYearly;
    const trialEndsAt = new Date(draftSyncAccess.subscriptionSource === "trial" ? draftSyncAccess.accessUntil : "");
    trialProgress.parentElement.hidden = !Number.isFinite(trialEndsAt.getTime());
    if (!Number.isFinite(trialEndsAt.getTime())) {
      paddleBillingStatus.textContent = "Subscribe to save, edit, delete, and schedule drafts on the web.";
    } else {
      const daysLeft = Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
      const endDate = trialEndsAt.toLocaleDateString(undefined, { day: "numeric", month: "long" });
      trialProgress.style.width = `${Math.min(100, Math.max(0, ((14 - daysLeft) / 14) * 100))}%`;
      paddleBillingStatus.textContent = daysLeft > 0
        ? `${daysLeft} ${daysLeft === 1 ? "day" : "days"} left · Ends ${endDate}`
        : `Trial ended ${endDate}. Subscribe to save, edit, delete, and schedule drafts on the web.`;
    }
  }

  function initializePaddle() {
    if (!CONFIG.paddleClientToken || !window.Paddle || window.Paddle.Initialized) return;
    if (CONFIG.paddleEnvironment === "sandbox") window.Paddle.Environment.set("sandbox");
    window.Paddle.Initialize({
      token: CONFIG.paddleClientToken,
      eventCallback: (event) => {
        if (event.name === "checkout.completed") {
          showToast("Payment complete. Pro access will appear shortly.");
          let attempts = 0;
          const checkPurchase = async () => {
            attempts += 1;
            await refreshEntitlement(true);
            if (draftSyncAccess.isPro) {
              if (planSheet.open) planSheet.close();
              showToast("Pro access is active.");
            } else if (attempts < 20) {
              setTimeout(checkPurchase, 3000);
            } else {
              showToast("Purchase received. Refresh Settings shortly if Pro access hasn’t appeared.");
            }
          };
          setTimeout(checkPurchase, 1500);
        }
      }
    });
    renderPaddleBilling();
  }

  // Open in every tier, lapsed included: docs/product/tiers.md "Export".
  async function exportAllDrafts() {
    const credential = linkedInCredential();
    if (!credential) {
      showToast("Connect LinkedIn first");
      return;
    }
    exportDrafts.disabled = true;
    try {
      const url = new URL(`${API_BASE_URL}/api/drafts/export`);
      url.searchParams.set("memberId", credential.memberId);
      const response = await fetch(url, { headers: { Authorization: `Bearer ${credential.accessToken}` } });
      if (!response.ok) throw new Error("Export failed");
      const href = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = href;
      link.download = "bloomary-drafts.zip";
      link.click();
      URL.revokeObjectURL(href);
    } catch (error) {
      showToast(error.message || "Export failed");
    } finally {
      exportDrafts.disabled = false;
    }
  }

  async function deleteAccountData() {
    const token = readStore(LINKEDIN_TOKEN_KEY);
    const profile = token.profile || {};
    const linkedInId = linkedInMemberId(profile);
    if (!hasLinkedInToken(token) || !linkedInId) {
      showToast("Connect LinkedIn first");
      return;
    }
    const confirmed = window.confirm("Delete connected Bloomary account data and clear this browser?");
    if (!confirmed) return;

    deleteAccount.disabled = true;
    linkedinDisconnect.disabled = true;
    try {
      const response = await fetch(`${API_BASE_URL}/api/account/delete`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token.accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ linkedInId })
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.errorDescription || "Account deletion failed");
      }
      removeStore(LINKEDIN_TOKEN_KEY);
      removeStore(DRAFTS_KEY);
      removeStore(PENDING_MUTATIONS_KEY);
      localStorage.removeItem(GEMINI_API_KEY);
      localStorage.removeItem(REDUCE_DATA_KEY);
      sessionStorage.removeItem(GEMINI_API_KEY);
      sessionStorage.removeItem(LINKEDIN_OAUTH_STATE_KEY);
      pendingMutations = [];
      draftSyncAccess = { ...DEFAULT_DRAFT_SYNC_ACCESS };
      activeDraftId = null;
      newEditorState();
      renderDraftTable();
      renderLinkedInSettings();
      renderAISettings();
      renderSyncSettings();
      renderPaddleBilling();
      await new Promise((resolve, reject) => {
        const request = indexedDB.deleteDatabase("bloomary-cache");
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error("Account deleted, but cached images could not be cleared. Clear this site's browser data."));
        request.onblocked = () => reject(new Error("Account deleted, but cached images are blocked by another tab. Close other Bloomary tabs and clear this site's browser data."));
      });
      showToast("Account data deleted");
    } catch (error) {
      showToast(error.message);
      renderLinkedInSettings();
    }
  }

  async function startLinkedInAuth() {
    if (linkedInAuthInFlight) return;
    if (hasLinkedInToken(readStore(LINKEDIN_TOKEN_KEY))) {
      showToast("LinkedIn is already connected.");
      return;
    }

    let authWindow = window.open("", "bloomaryLinkedInAuth", "width=520,height=720");
    if (!authWindow) {
      showToast("Allow popups to connect LinkedIn");
      return;
    }

    linkedInAuthInFlight = true;
    linkedinConnect.disabled = true;
    try {
      const response = await fetch(`${API_BASE_URL}/api/linkedin/cli/start?fresh=1&client=web`);
      const start = await response.json();
      if (!response.ok) throw new Error(start.errorDescription || "LinkedIn authorization failed to start");
      sessionStorage.setItem(LINKEDIN_OAUTH_STATE_KEY, JSON.stringify({ state: start.state, pollUrl: start.pollUrl }));
      authWindow.location.href = start.authUrl;

      try {
        await pollLinkedInAuth(start.pollUrl, authWindow);
      } finally {
        try { authWindow.close(); } catch {}
      }
    } catch (error) {
      try { authWindow.close(); } catch {}
      showToast(error.message);
    } finally {
      linkedInAuthInFlight = false;
      renderLinkedInSettings();
    }
  }

  // Keeps polling for two more rounds after the popup closes: the callback page may close it right after success.
  async function pollLinkedInAuth(pollUrl, authWindow) {
    let pendingAfterClose = 0;
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const separator = pollUrl.includes("?") ? "&" : "?";
      const response = await fetch(`${API_BASE_URL}${pollUrl}${separator}wait=25`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.errorDescription || "LinkedIn authorization failed");
      if (result.status === "pending") {
        if (authWindow?.closed && ++pendingAfterClose >= 2) throw new Error("LinkedIn window was closed before connecting.");
        continue;
      }
      if (result.status === "error") throw new Error(result.errorDescription || result.error || "LinkedIn authorization failed");

      const token = normalizeLinkedInToken(result);
      if (!hasLinkedInToken(token)) throw new Error("LinkedIn token response did not include a usable token");
      const expiresAt = Number(token.expiresIn) > 0 ? new Date(Date.now() + Number(token.expiresIn) * 1000).toISOString() : "";
      writeStore(LINKEDIN_TOKEN_KEY, { ...token, expiresAt });
      sessionStorage.removeItem(LINKEDIN_OAUTH_STATE_KEY);
      renderLinkedInSettings();
      lastRemoteFetchAt = 0;
      refreshEntitlement(true).then(() => loadRemoteDrafts());
      showToast("LinkedIn connected");
      return;
    }
    throw new Error("LinkedIn authorization timed out");
  }

  function copyText() {
    const body = cleanText();
    if (!body) {
      showToast("Nothing to copy");
      return;
    }
    navigator.clipboard.writeText(body)
      .then(() => showToast("Copied"))
      .catch(() => {
        const textarea = document.createElement("textarea");
        textarea.value = body;
        document.body.append(textarea);
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
        showToast("Copied");
      });
  }

  document.querySelectorAll("[data-command]").forEach((button) => {
    button.addEventListener("mousedown", (event) => event.preventDefault());
    button.addEventListener("click", () => {
      editor.focus();
      runInlineCommand(button.dataset.command);
    });
  });

  document.querySelectorAll("[data-text-command]").forEach((button) => {
    button.addEventListener("mousedown", (event) => event.preventDefault());
    button.addEventListener("click", () => {
      editor.focus();
      runTextCommand(button.dataset.textCommand);
    });
  });

  document.getElementById("blockFormat").addEventListener("change", (event) => {
    editor.focus();
    if (event.target.value === "h2") transformSelection(unicodeBold);
    event.target.value = "p";
  });

  document.getElementById("addLink").addEventListener("click", () => {
    const url = window.prompt("URL");
    if (!url) return;
    editor.focus();
    const selection = plainSelectedText();
    const replacement = selection.text ? `${selection.text} ${url}` : url;
    replaceEditorText(selection.start, selection.end, replacement);
  });

  openEmojiPicker.addEventListener("mousedown", (event) => event.preventDefault());
  openEmojiPicker.addEventListener("click", () => {
    rememberEditorSelection();
    emojiModal.hidden = false;
  });
  emojiPickerClose.addEventListener("click", () => {
    emojiModal.hidden = true;
    editor.focus();
  });

  document.querySelectorAll("[data-device]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-device]").forEach((item) => item.classList.remove("is-active"));
      button.classList.add("is-active");
      previewCard.classList.toggle("mobile", button.dataset.device === "mobile");
    });
  });

  document.querySelectorAll("[data-theme]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-theme]").forEach((item) => item.classList.remove("is-active"));
      button.classList.add("is-active");
      previewCard.classList.toggle("dark", button.dataset.theme === "dark");
    });
  });

  document.getElementById("saveDraft").addEventListener("click", saveDraft);
  document.getElementById("scheduleMenu").addEventListener("toggle", (event) => {
    if (event.target.open && draftSyncAccess.tier === "lapsed") {
      event.target.open = false;
      showSubscriptionOptions("Publishing needs an active plan.");
      return;
    }
    if (event.target.open) {
      scheduleAt.value = localDateTimeValue(defaultScheduleDate());
      resetScheduleRange();
    }
  });
  scheduleAt.addEventListener("focus", resetScheduleRange);
  schedulePost.addEventListener("click", scheduleCurrentDraft);
  document.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s" && !editorView.hidden) {
      event.preventDefault();
      if (!event.repeat) saveDraft();
    }
  });
  naturalizeEnglish.addEventListener("click", naturalizeDraft);
  postLanguage?.addEventListener("change", () => savePostLanguage(postLanguage.value));
  publishLinkedIn.addEventListener("click", publishToLinkedIn);
  attachPostFile.addEventListener("click", openImageEditor);
  removeAttachment.addEventListener("click", () => {
    clearPostAttachment();
    keepRemoteImage = false;
  });
  postAttachment.addEventListener("change", () => {
    const file = postAttachment.files[0];
    setPostAttachment(file);
    if (file) {
      imageEditorModal.hidden = false;
      loadImageEditorFile(file);
    }
  });
  imageEditorFile.addEventListener("change", () => loadImageEditorFile(imageEditorFile.files[0]));
  ["dragenter", "dragover"].forEach((eventName) => {
    imageEditorDrop.addEventListener(eventName, (event) => {
      event.preventDefault();
      imageEditorDrop.classList.add("is-dragover");
    });
  });
  ["dragleave", "drop"].forEach((eventName) => {
    imageEditorDrop.addEventListener(eventName, (event) => {
      event.preventDefault();
      imageEditorDrop.classList.remove("is-dragover");
    });
  });
  imageEditorDrop.addEventListener("drop", (event) => loadImageEditorFile(event.dataTransfer.files[0]));
  imageEditorCancel.addEventListener("click", closeImageEditor);
  imageEditorClear.addEventListener("click", () => {
    imageEditorText.value = "";
    renderImageEditor();
    imageEditorText.focus();
  });
  imageEditorText.addEventListener("input", renderImageEditor);
  imageEditorStyle.addEventListener("click", () => {
    imageEditorState.styleIndex = (imageEditorState.styleIndex + 1) % imageEditorStyles.length;
    renderImageEditor();
  });
  imageEditorAlign.addEventListener("click", () => {
    imageEditorState.alignIndex = (imageEditorState.alignIndex + 1) % imageEditorAlignments.length;
    renderImageEditor();
  });
  imageEditorDone.addEventListener("click", finishImageEditor);
  imageEditorStage.addEventListener("pointerdown", (event) => {
    if (event.target === imageEditorText) return;
    imageEditorDrag = event.pointerId;
    imageEditorStage.setPointerCapture(event.pointerId);
    setImageEditorPosition(event);
  });
  imageEditorStage.addEventListener("pointermove", (event) => {
    if (imageEditorDrag === event.pointerId) setImageEditorPosition(event);
  });
  imageEditorStage.addEventListener("pointerup", () => {
    imageEditorDrag = null;
  });
  document.addEventListener("keydown", (event) => {
    if (!imageEditorModal.hidden && event.key === "Escape") closeImageEditor();
    if (!emojiModal.hidden && event.key === "Escape") {
      emojiModal.hidden = true;
      editor.focus();
    }
  });
  document.getElementById("newDraft").addEventListener("click", () => {
    if (!confirmDiscardEditor()) return;
    newEditorState();
    showView("editor");
    editor.focus();
  });
  [navEditor, ...document.querySelectorAll(".nav-brand, .mobile-brand")].forEach((link) => link.addEventListener("click", (event) => {
    event.preventDefault();
    showView("editor");
    editor.focus();
  }));
  navDrafts.addEventListener("click", (event) => {
    event.preventDefault();
    showView("drafts");
  });
  navInsights.addEventListener("click", (event) => {
    event.preventDefault();
    showView("insights");
  });
  navSettings.addEventListener("click", (event) => {
    event.preventDefault();
    showView("settings");
  });
  window.addEventListener("popstate", () => showView(viewFromPath(), { updateHistory: false }));
  startFromInsight.addEventListener("click", () => {
    if (!confirmDiscardEditor()) return;
    activeDraftId = null;
    clearPostAttachment();
    editor.value = "I used to think my story was too ordinary to post.\n\nThen I looked at what actually changed:\n\n- a problem I survived\n- a skill I built\n- a result I can prove\n- a person I can help now\n\nHere is the lesson:";
    renderPreview();
    showView("editor");
    placeCursorAtEnd();
  });
  draftFilter.addEventListener("input", renderDraftTable);
  draftScopeButtons.forEach((button) => button.addEventListener("click", () => {
    draftScope = button.dataset.draftScope;
    draftScopeButtons.forEach((item) => {
      const isActive = item === button;
      item.classList.toggle("is-active", isActive);
      item.setAttribute("aria-selected", String(isActive));
    });
    renderDraftTable();
  }));
  draftScheduleClose.addEventListener("click", closeDraftScheduleDialog);
  draftScheduleCancel.addEventListener("click", closeDraftScheduleDialog);
  draftScheduleConfirm.addEventListener("click", confirmDraftSchedule);
  linkedinConnect.addEventListener("click", startLinkedInAuth);
  planSheet.addEventListener("close", () => paddleBillingHome.insertBefore(paddleBillingBox, paddleBillingHomeNext));
  document.getElementById("planSheetClose").addEventListener("click", () => planSheet.close());
  tierBannerAction.addEventListener("click", () => {
    if (linkedInCredential()) showSubscriptionOptions(null);
    else startLinkedInAuth();
  });
  linkedinDisconnect.addEventListener("click", disconnectLinkedIn);
  async function openPaddleCheckout(priceId, button) {
    const credential = linkedInCredential();
    if (!credential) {
      showToast("Connect LinkedIn first");
      return;
    }
    if (!window.Paddle?.Initialized) initializePaddle();
    if (!window.Paddle?.Initialized) {
      showToast("Paddle checkout is unavailable. Refresh and try again.");
      return;
    }
    // Paddle's overlay sits under a modal dialog's top layer.
    if (planSheet.open) planSheet.close();
    button.disabled = true;
    try {
      const identityUrl = new URL(`${API_BASE_URL}/api/paddle/checkout-identity`);
      identityUrl.searchParams.set("memberId", credential.memberId);
      const response = await fetch(identityUrl, {
        headers: { Authorization: `Bearer ${credential.accessToken}` }
      });
      const identity = await response.json().catch(() => ({}));
      if (!response.ok || !identity.signature) {
        throw new Error(identity.errorDescription || "Could not prepare Paddle checkout");
      }
      const email = readStore(LINKEDIN_TOKEN_KEY)?.profile?.email;
      window.Paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        customData: { member_id: identity.memberId, member_signature: identity.signature },
        ...(email ? { customer: { email } } : {})
      });
    } catch (error) {
      showToast(error.message);
    } finally {
      button.disabled = false;
    }
  }

  paddleSubscribe.addEventListener("click", () => {
    openPaddleCheckout(CONFIG.paddlePriceProMonthly, paddleSubscribe);
  });
  paddleSubscribeYearly.addEventListener("click", () => {
    openPaddleCheckout(CONFIG.paddlePriceProYearly, paddleSubscribeYearly);
  });
  paddleManage.addEventListener("click", async () => {
    if (draftSyncAccess.subscriptionSource === "apple") {
      window.alert("Manage this subscription in the App Store, where you originally subscribed.");
      return;
    }
    const credential = linkedInCredential();
    if (!credential) {
      showToast("Connect LinkedIn first");
      return;
    }
    paddleManage.disabled = true;
    try {
      const portalUrl = new URL(`${API_BASE_URL}/api/paddle/portal`);
      portalUrl.searchParams.set("memberId", credential.memberId);
      const response = await fetch(portalUrl, {
        method: "POST",
        headers: { Authorization: `Bearer ${credential.accessToken}` }
      });
      const portal = await response.json().catch(() => ({}));
      if (response.status === 404 && portal.error === "paddle_customer_not_found") {
        window.alert(
          "This subscription was not purchased through Paddle. Manage it where you originally subscribed, such as in the App Store."
        );
        return;
      }
      if (!response.ok || !portal.url) {
        throw new Error(portal.errorDescription || "Could not open billing settings");
      }
      window.location.href = portal.url;
    } catch (error) {
      showToast(error.message);
    } finally {
      paddleManage.disabled = false;
    }
  });
  deleteAccount.addEventListener("click", deleteAccountData);
  exportDrafts.addEventListener("click", exportAllDrafts);
  manageGeminiAPIKey.addEventListener("click", () => {
    geminiKeyControls.hidden = !geminiKeyControls.hidden;
    if (!geminiKeyControls.hidden) geminiAPIKey.focus();
  });
  saveGeminiAPIKey.addEventListener("click", () => {
    const value = geminiAPIKey.value.trim();
    if (!value || value === "********") {
      showToast("Gemini API key is empty");
      return;
    }
    sessionStorage.setItem(GEMINI_API_KEY, value);
    renderAISettings();
    geminiKeyControls.hidden = true;
    showToast("Gemini API key saved");
  });
  clearGeminiAPIKey.addEventListener("click", () => {
    sessionStorage.removeItem(GEMINI_API_KEY);
    renderAISettings();
    showToast("Gemini API key cleared");
  });
  syncEnabledToggle.addEventListener("change", () => {
    localStorage.setItem(REDUCE_DATA_KEY, String(!syncEnabledToggle.checked));
    renderSyncSettings();
    showToast(syncEnabledToggle.checked ? "Draft sync enabled" : "Draft sync paused");
  });
  feedbackButton.addEventListener("click", () => {
    feedbackForm.hidden = false;
    feedbackMessage.focus();
  });
  feedbackCancel.addEventListener("click", () => {
    feedbackForm.hidden = true;
  });
  feedbackForm.addEventListener("submit", sendFeedbackEmail);
  document.getElementById("copyText").addEventListener("click", copyText);
  document.getElementById("showPreview").addEventListener("click", () => {
    const show = !previewPane.classList.contains("is-visible");
    previewPane.classList.toggle("is-visible", show);
    if (show) previewPane.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  moreToggle.addEventListener("click", () => {
    const collapsed = previewBody.classList.toggle("collapsed");
    moreToggle.textContent = collapsed ? "…more" : "show less";
  });

  editor.addEventListener("input", () => {
    rememberEditorSelection();
    renderPreview();
  });
  editor.addEventListener("keyup", rememberEditorSelection);
  editor.addEventListener("mouseup", rememberEditorSelection);
  editor.addEventListener("focus", rememberEditorSelection);

  renderEmojiPicker();
  renderBestPostTime();
  renderCookieConsent();
  renderPreview();
  renderDraftTable();
  renderLinkedInSettings();
  refreshLinkedInProfile();
  initializePaddle();
  renderPaddleBilling();
  loadRemoteDrafts();
  renderAISettings();
  renderSyncSettings();
  showView(viewFromPath(), { replaceHistory: true });

  window.addEventListener("beforeunload", (event) => {
    if (!isEditorDirty()) return;
    event.preventDefault();
    event.returnValue = "";
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      drainPendingMutations();
      loadRemoteDrafts();
    }
  });

  window.addEventListener("focus", () => {
    drainPendingMutations();
    loadRemoteDrafts();
  });

  setInterval(() => {
    if (!document.hidden) {
      drainPendingMutations();
    }
  }, 60000);
})();
