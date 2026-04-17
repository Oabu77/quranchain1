/**
 * MessagingSystem — DarCloud Empire Messaging UI
 * ================================================
 * Server-rendered HTML component with embedded client-side JS.
 * Uses the /messaging/* API endpoints for CRUD operations.
 * Polls for new messages (WebSockets upgrade path available).
 *
 * Exports:
 *   MESSAGING_PAGE — full page HTML for /messages route
 */

import { pageShell } from "../pages";

const MESSAGING_STYLES = `
<style>
  .msg-app{display:flex;height:calc(100vh - 140px);max-width:1200px;width:100%;gap:0;border:1px solid var(--bdr);border-radius:16px;overflow:hidden;background:var(--s1)}
  .msg-sidebar{width:320px;border-right:1px solid var(--bdr);display:flex;flex-direction:column;background:var(--s1)}
  .msg-sidebar-header{padding:1rem;border-bottom:1px solid var(--bdr);display:flex;justify-content:space-between;align-items:center}
  .msg-sidebar-header h2{font-size:1.1rem;margin:0;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
  .msg-search{padding:.5rem 1rem}
  .msg-search input{width:100%;padding:.5rem .75rem;background:var(--s2);border:1px solid var(--bdr);border-radius:8px;color:var(--txt);font-size:.85rem;outline:none}
  .msg-search input:focus{border-color:var(--cyan)}
  .msg-list{flex:1;overflow-y:auto;scrollbar-width:thin;scrollbar-color:var(--bdr) transparent}
  .msg-item{display:flex;align-items:center;gap:.75rem;padding:.75rem 1rem;cursor:pointer;border-bottom:1px solid rgba(33,38,45,.5);transition:background .15s}
  .msg-item:hover,.msg-item.active{background:var(--s2)}
  .msg-item.active{border-left:3px solid var(--cyan)}
  .msg-avatar{width:40px;height:40px;border-radius:50%;background:var(--grad);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1rem;flex-shrink:0;color:#000}
  .msg-item-info{flex:1;min-width:0}
  .msg-item-name{font-weight:600;font-size:.9rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .msg-item-preview{font-size:.8rem;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .msg-item-time{font-size:.7rem;color:var(--muted);flex-shrink:0}
  .msg-unread-badge{background:var(--cyan);color:#000;font-size:.65rem;font-weight:700;padding:2px 6px;border-radius:10px;flex-shrink:0}
  .msg-chat{flex:1;display:flex;flex-direction:column;background:var(--bg)}
  .msg-chat-header{padding:1rem;border-bottom:1px solid var(--bdr);display:flex;align-items:center;gap:.75rem;background:var(--s1)}
  .msg-chat-header h3{margin:0;font-size:1rem}
  .msg-chat-header .status{font-size:.75rem;color:var(--emerald)}
  .msg-messages{flex:1;overflow-y:auto;padding:1rem;display:flex;flex-direction:column;gap:.5rem;scrollbar-width:thin;scrollbar-color:var(--bdr) transparent}
  .msg-bubble{max-width:70%;padding:.6rem 1rem;border-radius:12px;font-size:.9rem;line-height:1.4;word-break:break-word;position:relative}
  .msg-bubble.sent{align-self:flex-end;background:linear-gradient(135deg,#0ea5e9,#06b6d4);color:#000;border-bottom-right-radius:4px}
  .msg-bubble.received{align-self:flex-start;background:var(--s2);border:1px solid var(--bdr);border-bottom-left-radius:4px}
  .msg-bubble.system{align-self:center;background:transparent;color:var(--muted);font-size:.8rem;font-style:italic;padding:.25rem}
  .msg-bubble-sender{font-size:.7rem;font-weight:600;color:var(--cyan);margin-bottom:.15rem}
  .msg-bubble-time{font-size:.65rem;color:rgba(255,255,255,.5);margin-top:.2rem;text-align:right}
  .msg-bubble.received .msg-bubble-time{color:var(--muted)}
  .msg-bubble-edited{font-size:.6rem;color:var(--muted);font-style:italic}
  .msg-input-area{padding:.75rem 1rem;border-top:1px solid var(--bdr);display:flex;gap:.5rem;align-items:flex-end;background:var(--s1)}
  .msg-input-area textarea{flex:1;padding:.6rem .75rem;background:var(--s2);border:1px solid var(--bdr);border-radius:12px;color:var(--txt);font-size:.9rem;outline:none;resize:none;min-height:40px;max-height:120px;font-family:inherit;line-height:1.4}
  .msg-input-area textarea:focus{border-color:var(--cyan)}
  .msg-send-btn{padding:.6rem 1rem;background:var(--grad);border:none;border-radius:10px;color:#000;font-weight:600;cursor:pointer;font-size:.85rem;transition:opacity .2s;white-space:nowrap}
  .msg-send-btn:hover{opacity:.85}
  .msg-send-btn:disabled{opacity:.4;cursor:not-allowed}
  .msg-empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--muted);gap:1rem}
  .msg-empty-icon{font-size:3rem;opacity:.3}
  .msg-new-btn{background:var(--grad);color:#000;border:none;padding:.4rem .75rem;border-radius:8px;font-size:.8rem;font-weight:600;cursor:pointer;transition:opacity .2s}
  .msg-new-btn:hover{opacity:.85}
  .msg-modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.7);display:none;align-items:center;justify-content:center;z-index:1000}
  .msg-modal-overlay.show{display:flex}
  .msg-modal{background:var(--s1);border:1px solid var(--bdr);border-radius:16px;padding:1.5rem;width:100%;max-width:400px}
  .msg-modal h3{margin:0 0 1rem;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
  .msg-typing{font-size:.75rem;color:var(--emerald);padding:0 1rem .25rem;font-style:italic;min-height:1.1rem}
  @media(max-width:768px){
    .msg-sidebar{width:100%;position:absolute;z-index:10;height:100%}
    .msg-sidebar.hidden{display:none}
    .msg-app{position:relative;height:calc(100vh - 120px)}
    .msg-back-btn{display:inline-block !important}
  }
  .msg-back-btn{display:none;background:none;border:none;color:var(--cyan);cursor:pointer;font-size:1.2rem;padding:.25rem}
</style>
`;

const MESSAGING_BODY = `
${MESSAGING_STYLES}
<div class="msg-app" id="msgApp">
  <!-- Sidebar: Conversation List -->
  <div class="msg-sidebar" id="msgSidebar">
    <div class="msg-sidebar-header">
      <h2>💬 Messages</h2>
      <button class="msg-new-btn" onclick="showNewConvoModal()">+ New</button>
    </div>
    <div class="msg-search">
      <input type="text" id="msgSearchInput" placeholder="Search messages..." oninput="handleSearch(this.value)">
    </div>
    <div class="msg-list" id="msgConvoList">
      <div class="msg-empty">
        <div class="msg-empty-icon">📭</div>
        <p>Loading conversations...</p>
      </div>
    </div>
  </div>

  <!-- Chat Area -->
  <div class="msg-chat" id="msgChat">
    <div class="msg-empty" id="msgEmptyState">
      <div class="msg-empty-icon">💬</div>
      <p>Select a conversation or start a new one</p>
      <p style="font-size:.85rem;color:var(--gold);font-style:italic">بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
    </div>
    <div id="msgChatView" style="display:none;flex-direction:column;height:100%">
      <div class="msg-chat-header">
        <button class="msg-back-btn" onclick="showSidebar()">←</button>
        <div class="msg-avatar" id="chatAvatar">?</div>
        <div>
          <h3 id="chatTitle">Conversation</h3>
          <div class="status" id="chatStatus">● Online</div>
        </div>
      </div>
      <div class="msg-messages" id="msgMessages"></div>
      <div class="msg-typing" id="msgTyping"></div>
      <div class="msg-input-area">
        <textarea id="msgInput" placeholder="Type a message..." rows="1"
          onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendMessage()}"
          oninput="autoResizeInput(this)"></textarea>
        <button class="msg-send-btn" id="msgSendBtn" onclick="sendMessage()">Send ➤</button>
      </div>
    </div>
  </div>
</div>

<!-- New Conversation Modal -->
<div class="msg-modal-overlay" id="newConvoModal">
  <div class="msg-modal">
    <h3>New Conversation</h3>
    <div class="form-group">
      <label>Recipient Email</label>
      <input type="email" id="newConvoEmail" placeholder="user@example.com" class="form-group input"
        style="width:100%;padding:.6rem .75rem;background:var(--s2);border:1px solid var(--bdr);border-radius:8px;color:var(--txt);font-size:.9rem;outline:none">
    </div>
    <div class="form-group" style="margin-top:.75rem">
      <label>First Message</label>
      <textarea id="newConvoMessage" placeholder="Assalamu Alaikum..." rows="3"
        style="width:100%;padding:.6rem .75rem;background:var(--s2);border:1px solid var(--bdr);border-radius:8px;color:var(--txt);font-size:.9rem;outline:none;resize:vertical;font-family:inherit"></textarea>
    </div>
    <div style="display:flex;gap:.5rem;margin-top:1rem">
      <button class="msg-send-btn" style="flex:1" onclick="createConversation()">Start Chat</button>
      <button class="msg-send-btn" style="flex:1;background:var(--s2);color:var(--txt);border:1px solid var(--bdr)" onclick="hideNewConvoModal()">Cancel</button>
    </div>
    <div id="newConvoError" style="color:var(--err);font-size:.85rem;margin-top:.5rem;display:none"></div>
  </div>
</div>

<script>
(function() {
  const API_BASE = window.location.origin;
  let token = null;
  let currentUserId = null;
  let activeConvoId = null;
  let conversations = [];
  let pollInterval = null;

  // ── Auth: read token from cookie or localStorage ──
  function getToken() {
    // Try cookie first (SSO)
    const cookies = document.cookie.split(';');
    for (const c of cookies) {
      const [k, v] = c.trim().split('=');
      if (k === 'darcloud_session' && v) return v;
    }
    // Try localStorage
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('darcloud_token')) return localStorage.getItem(key);
    }
    return null;
  }

  function authHeaders() {
    return { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };
  }

  async function apiFetch(path, opts = {}) {
    const resp = await fetch(API_BASE + path, { ...opts, headers: { ...authHeaders(), ...(opts.headers || {}) } });
    if (resp.status === 401) {
      window.location.href = '/login?redirect=/messages';
      throw new Error('Unauthorized');
    }
    return resp.json();
  }

  // ── Init ──
  async function init() {
    token = getToken();
    if (!token) {
      window.location.href = '/login?redirect=/messages';
      return;
    }
    // Decode JWT to get user ID
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
      currentUserId = payload.sub;
    } catch(e) { console.error('Token decode failed', e); }

    await loadConversations();
    // Poll for new messages every 5 seconds
    pollInterval = setInterval(pollUpdates, 5000);
  }

  // ── Load conversations list ──
  async function loadConversations() {
    try {
      const data = await apiFetch('/messaging/conversations');
      conversations = data.conversations || [];
      renderConversationList();
    } catch(e) {
      document.getElementById('msgConvoList').innerHTML =
        '<div class="msg-empty"><div class="msg-empty-icon">⚠️</div><p>Failed to load</p></div>';
    }
  }

  function renderConversationList() {
    const list = document.getElementById('msgConvoList');
    if (!conversations.length) {
      list.innerHTML = '<div class="msg-empty"><div class="msg-empty-icon">📭</div><p>No conversations yet</p><p style="font-size:.85rem">Start a new one!</p></div>';
      return;
    }
    list.innerHTML = conversations.map(c => {
      const initial = (c.title || 'DM')[0].toUpperCase();
      const preview = c.last_message ? (c.last_message.length > 40 ? c.last_message.slice(0,40) + '...' : c.last_message) : 'No messages';
      const time = c.last_message_at ? timeAgo(c.last_message_at) : '';
      const active = c.id === activeConvoId ? ' active' : '';
      const unread = c.last_read_at && c.last_message_at && c.last_message_at > c.last_read_at
        ? '<span class="msg-unread-badge">NEW</span>' : '';
      return '<div class="msg-item' + active + '" onclick="window._msgSelectConvo(' + c.id + ')">' +
        '<div class="msg-avatar">' + escapeHtml(initial) + '</div>' +
        '<div class="msg-item-info"><div class="msg-item-name">' + escapeHtml(c.title || 'Direct Message') + '</div>' +
        '<div class="msg-item-preview">' + escapeHtml(preview) + '</div></div>' +
        '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">' +
        '<span class="msg-item-time">' + time + '</span>' + unread + '</div></div>';
    }).join('');
  }

  // ── Select & load a conversation ──
  async function selectConversation(convoId) {
    activeConvoId = convoId;
    renderConversationList();
    document.getElementById('msgEmptyState').style.display = 'none';
    document.getElementById('msgChatView').style.display = 'flex';

    const convo = conversations.find(c => c.id === convoId);
    document.getElementById('chatTitle').textContent = convo?.title || 'Direct Message';
    document.getElementById('chatAvatar').textContent = (convo?.title || 'D')[0].toUpperCase();

    // Hide sidebar on mobile
    if (window.innerWidth <= 768) {
      document.getElementById('msgSidebar').classList.add('hidden');
    }

    await loadMessages(convoId);
  }
  window._msgSelectConvo = selectConversation;

  async function loadMessages(convoId) {
    const container = document.getElementById('msgMessages');
    container.innerHTML = '<div style="text-align:center;color:var(--muted);padding:2rem">Loading...</div>';
    try {
      const data = await apiFetch('/messaging/conversations/' + convoId + '/messages');
      const msgs = data.messages || [];
      if (!msgs.length) {
        container.innerHTML = '<div style="text-align:center;color:var(--muted);padding:2rem">No messages yet. Say Salam! 🤝</div>';
        return;
      }
      container.innerHTML = msgs.map(renderMessage).join('');
      container.scrollTop = container.scrollHeight;
    } catch(e) {
      container.innerHTML = '<div style="text-align:center;color:var(--err);padding:2rem">Failed to load messages</div>';
    }
  }

  function renderMessage(m) {
    if (m.type === 'system') {
      return '<div class="msg-bubble system">' + escapeHtml(m.content) + '</div>';
    }
    const isSent = m.sender_id === currentUserId;
    const cls = isSent ? 'sent' : 'received';
    const sender = !isSent ? '<div class="msg-bubble-sender">' + escapeHtml(m.sender_name || 'User') + '</div>' : '';
    const edited = m.edited_at ? ' <span class="msg-bubble-edited">(edited)</span>' : '';
    const time = m.created_at ? formatTime(m.created_at) : '';
    return '<div class="msg-bubble ' + cls + '">' + sender +
      '<div>' + escapeHtml(m.content) + edited + '</div>' +
      '<div class="msg-bubble-time">' + time + '</div></div>';
  }

  // ── Send message ──
  async function sendMessage() {
    if (!activeConvoId) return;
    const input = document.getElementById('msgInput');
    const content = input.value.trim();
    if (!content) return;

    const btn = document.getElementById('msgSendBtn');
    btn.disabled = true;
    input.value = '';
    input.style.height = 'auto';

    try {
      const data = await apiFetch('/messaging/conversations/' + activeConvoId + '/messages', {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
      if (data.success && data.message) {
        const container = document.getElementById('msgMessages');
        // Remove "no messages" placeholder
        if (container.querySelector('[style*="padding:2rem"]')) container.innerHTML = '';
        container.insertAdjacentHTML('beforeend', renderMessage({
          ...data.message, sender_name: 'You', sender_id: currentUserId
        }));
        container.scrollTop = container.scrollHeight;
      }
    } catch(e) {
      input.value = content; // Restore on failure
    }
    btn.disabled = false;
    input.focus();
  }
  window.sendMessage = sendMessage;

  // ── Create new conversation ──
  async function createConversation() {
    const email = document.getElementById('newConvoEmail').value.trim();
    const message = document.getElementById('newConvoMessage').value.trim();
    const errEl = document.getElementById('newConvoError');
    errEl.style.display = 'none';

    if (!email) { errEl.textContent = 'Email required'; errEl.style.display = 'block'; return; }

    try {
      // Look up user by email
      const userResp = await apiFetch('/auth/lookup?email=' + encodeURIComponent(email));
      if (!userResp.user) { errEl.textContent = 'User not found'; errEl.style.display = 'block'; return; }

      const convoData = await apiFetch('/messaging/conversations', {
        method: 'POST',
        body: JSON.stringify({ type: 'direct', participants: [userResp.user.id] }),
      });

      if (convoData.success) {
        hideNewConvoModal();
        await loadConversations();
        await selectConversation(convoData.conversation_id);
        if (message) {
          document.getElementById('msgInput').value = message;
          await sendMessage();
        }
      }
    } catch(e) {
      errEl.textContent = e.message || 'Failed to create conversation';
      errEl.style.display = 'block';
    }
  }
  window.createConversation = createConversation;

  // ── Poll for updates ──
  async function pollUpdates() {
    try {
      const data = await apiFetch('/messaging/unread');
      // Refresh conversation list if there are unread messages
      if (data.total_unread > 0) {
        await loadConversations();
      }
      // Reload active conversation messages
      if (activeConvoId) {
        await loadMessages(activeConvoId);
      }
    } catch(e) { /* silent */ }
  }

  // ── UI Helpers ──
  function showNewConvoModal() { document.getElementById('newConvoModal').classList.add('show'); }
  function hideNewConvoModal() {
    document.getElementById('newConvoModal').classList.remove('show');
    document.getElementById('newConvoEmail').value = '';
    document.getElementById('newConvoMessage').value = '';
    document.getElementById('newConvoError').style.display = 'none';
  }
  window.showNewConvoModal = showNewConvoModal;
  window.hideNewConvoModal = hideNewConvoModal;

  window.showSidebar = function() {
    document.getElementById('msgSidebar').classList.remove('hidden');
  };

  async function handleSearch(q) {
    if (q.length < 2) { renderConversationList(); return; }
    try {
      const data = await apiFetch('/messaging/search?q=' + encodeURIComponent(q));
      const results = data.results || [];
      const list = document.getElementById('msgConvoList');
      if (!results.length) {
        list.innerHTML = '<div class="msg-empty"><p style="font-size:.85rem">No results for "' + escapeHtml(q) + '"</p></div>';
        return;
      }
      list.innerHTML = results.map(r => {
        return '<div class="msg-item" onclick="window._msgSelectConvo(' + r.conversation_id + ')">' +
          '<div class="msg-avatar">🔍</div>' +
          '<div class="msg-item-info"><div class="msg-item-name">' + escapeHtml(r.sender_name || 'User') + '</div>' +
          '<div class="msg-item-preview">' + escapeHtml(r.content.slice(0, 50)) + '</div></div>' +
          '<span class="msg-item-time">' + timeAgo(r.created_at) + '</span></div>';
      }).join('');
    } catch(e) { /* silent */ }
  }
  window.handleSearch = handleSearch;

  function autoResizeInput(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }
  window.autoResizeInput = autoResizeInput;

  function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr + (dateStr.endsWith('Z') ? '' : 'Z')).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return mins + 'm';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h';
    const days = Math.floor(hrs / 24);
    return days + 'd';
  }

  function formatTime(dateStr) {
    try {
      const d = new Date(dateStr + (dateStr.endsWith('Z') ? '' : 'Z'));
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  }

  // ── Boot ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
</script>
`;

export const MESSAGING_PAGE = pageShell("Messages", MESSAGING_BODY);
