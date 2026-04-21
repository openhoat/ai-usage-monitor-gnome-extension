export function renderHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Usage Monitor</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: #1a1a2e;
      color: #e0e0e0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .header {
      width: 100%;
      background: #16213e;
      border-bottom: 1px solid #2a2a4a;
      padding: 16px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .header-icon {
      width: 24px;
      height: 24px;
      fill: #7c5cbf;
    }

    .header h1 {
      font-size: 18px;
      font-weight: 600;
      color: #e0e0e0;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .refresh-btn, .settings-btn {
      background: #2a2a4a;
      border: 1px solid #3a3a5a;
      color: #e0e0e0;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      transition: background 0.2s;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .refresh-btn:hover, .settings-btn:hover {
      background: #3a3a5a;
    }

    .refresh-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .refresh-btn svg {
      transition: transform 0.3s;
    }

    .refresh-btn.spinning svg {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .main-content {
      width: 100%;
      max-width: 600px;
      padding: 24px 16px;
      flex: 1;
    }

    .panel-label {
      text-align: center;
      font-size: 48px;
      font-weight: bold;
      margin: 24px 0;
      padding: 16px;
      border-radius: 12px;
      background: #16213e;
      border: 1px solid #2a2a4a;
    }

    .panel-label.low { color: #b8a0e0; }
    .panel-label.medium { color: #f39c12; }
    .panel-label.high { color: #e74c3c; }
    .panel-label.error { color: #e74c3c; }
    .panel-label.none { color: #888888; }

    .provider-section {
      background: #16213e;
      border: 1px solid #2a2a4a;
      border-radius: 12px;
      margin-bottom: 16px;
      overflow: hidden;
    }

    .provider-header {
      padding: 12px 16px;
      font-weight: 600;
      font-size: 14px;
      color: #b8a0e0;
      background: #1a1a3e;
      border-bottom: 1px solid #2a2a4a;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .provider-content {
      padding: 12px 16px;
    }

    .tier-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 6px 0;
    }

    .tier-name {
      min-width: 180px;
      font-size: 13px;
      color: #c0c0d0;
    }

    .bar-bg {
      flex: 1;
      height: 8px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      overflow: hidden;
      min-width: 120px;
    }

    .bar-fill {
      height: 8px;
      border-radius: 4px;
      transition: width 0.5s ease;
    }

    .bar-fill.low { background: #7c5cbf; }
    .bar-fill.medium { background: #f39c12; }
    .bar-fill.high { background: #e74c3c; }

    .tier-percentage {
      min-width: 45px;
      text-align: right;
      font-size: 13px;
      font-weight: bold;
      color: #e0e0e0;
    }

    .tier-status-icon {
      font-size: 14px;
      color: #2ecc71;
    }

    .plan-badge {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      background: #2a2a4a;
      color: #b8a0e0;
      text-transform: uppercase;
      font-weight: bold;
    }

    .reset-info {
      font-size: 12px;
      color: #aaaaaa;
      padding: 8px 0 4px 0;
    }

    .error-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 0;
    }

    .error-icon {
      color: #e74c3c;
      font-size: 16px;
    }

    .error-message {
      font-size: 12px;
      font-style: italic;
      color: #e74c3c;
    }

    .status-message {
      font-size: 12px;
      font-style: italic;
      color: #aaaaaa;
      padding: 12px 0;
      text-align: center;
    }

    .last-refresh {
      font-size: 11px;
      color: #888888;
      font-style: italic;
      text-align: center;
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid #2a2a4a;
    }

    .no-providers {
      text-align: center;
      padding: 32px 16px;
      color: #888888;
      font-style: italic;
    }

    .no-providers a {
      color: #7c5cbf;
      cursor: pointer;
      text-decoration: underline;
    }

    /* Settings panel */
    .settings-overlay {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.6);
      z-index: 100;
      justify-content: center;
      align-items: center;
    }

    .settings-overlay.active {
      display: flex;
    }

    .settings-panel {
      background: #1a1a2e;
      border: 1px solid #2a2a4a;
      border-radius: 12px;
      width: 90%;
      max-width: 500px;
      max-height: 80vh;
      overflow-y: auto;
      padding: 24px;
    }

    .settings-panel h2 {
      font-size: 18px;
      margin-bottom: 20px;
      color: #e0e0e0;
    }

    .provider-group {
      margin-bottom: 20px;
    }

    .provider-group h3 {
      font-size: 14px;
      color: #b8a0e0;
      margin-bottom: 4px;
    }

    .provider-group p {
      font-size: 12px;
      color: #888888;
      margin-bottom: 8px;
    }

    .provider-group input {
      width: 100%;
      background: #16213e;
      border: 1px solid #2a2a4a;
      color: #e0e0e0;
      padding: 10px 12px;
      border-radius: 6px;
      font-size: 13px;
      font-family: monospace;
    }

    .provider-group input:focus {
      outline: none;
      border-color: #7c5cbf;
    }

    .provider-group input::placeholder {
      color: #555;
    }

    .settings-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 20px;
    }

    .btn-save {
      background: #7c5cbf;
      color: white;
      border: none;
      padding: 10px 24px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.2s;
    }

    .btn-save:hover { background: #6a4cad; }

    .btn-cancel {
      background: #2a2a4a;
      color: #e0e0e0;
      border: 1px solid #3a3a5a;
      padding: 10px 24px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.2s;
    }

    .btn-cancel:hover { background: #3a3a5a; }

    .toast {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      background: #2a2a4a;
      color: #e0e0e0;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 200;
      opacity: 0;
      transition: opacity 0.3s;
      border: 1px solid #3a3a5a;
    }

    .toast.show { opacity: 1; }
    .toast.success { border-color: #2ecc71; }
    .toast.error { border-color: #e74c3c; }

    .about-section {
      margin-top: 24px;
      padding: 16px;
      background: #16213e;
      border: 1px solid #2a2a4a;
      border-radius: 12px;
      text-align: center;
    }

    .about-section p {
      font-size: 12px;
      color: #888888;
      margin: 4px 0;
    }

    .about-section a {
      color: #7c5cbf;
      text-decoration: none;
    }

    .about-section a:hover {
      text-decoration: underline;
    }

    @media (max-width: 600px) {
      .tier-name {
        min-width: 100px;
        font-size: 12px;
      }

      .bar-bg {
        min-width: 80px;
      }

      .header {
        padding: 12px 16px;
      }

      .refresh-btn span, .settings-btn span {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <svg class="header-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
      <h1>AI Usage Monitor</h1>
    </div>
    <div class="header-right">
      <button class="refresh-btn" id="refreshBtn" onclick="refreshData()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="23 4 23 10 17 10"></polyline>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
        </svg>
        <span>Refresh</span>
      </button>
      <button class="settings-btn" onclick="openSettings()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
        <span>Settings</span>
      </button>
    </div>
  </div>

  <div class="main-content">
    <div class="panel-label none" id="panelLabel">--</div>
    <div id="statusContent">
      <p class="status-message">Loading...</p>
    </div>

    <div class="about-section">
      <p>AI Usage Monitor v<span id="version">?</span></p>
      <p><a href="https://github.com/openhoat/ai-usage-monitor-gnome-extension" target="_blank" rel="noopener">GitHub</a></p>
    </div>
  </div>

  <!-- Settings overlay -->
  <div class="settings-overlay" id="settingsOverlay" onclick="closeSettingsOnOverlay(event)">
    <div class="settings-panel">
      <h2>Settings</h2>

      <div class="provider-group">
        <h3>Anthropic (API)</h3>
        <p>Your Anthropic Admin API key for usage monitoring.</p>
        <input type="text" id="anthropic_api_key" placeholder="sk-ant-..." autocomplete="off">
      </div>

      <div class="provider-group">
        <h3>Claude (claude.ai)</h3>
        <p>OAuth token from Claude Code. Run <code>claude auth</code> or check environment.</p>
        <input type="text" id="claude_token" placeholder="OAuth token..." autocomplete="off">
      </div>

      <div class="provider-group">
        <h3>Gemini (Google AI)</h3>
        <p>API key from Google AI Studio. aistudio.google.com → Get API Key.</p>
        <input type="text" id="gemini_api_key" placeholder="AIza..." autocomplete="off">
      </div>

      <div class="provider-group">
        <h3>OpenAI (ChatGPT)</h3>
        <p>Admin API key (not a regular key). platform.openai.com → Settings → API keys.</p>
        <input type="text" id="openai_api_key" placeholder="sk-..." autocomplete="off">
      </div>

      <div class="provider-group">
        <h3>Ollama</h3>
        <p>Session cookie from ollama.com. F12 → Application → Cookies → __Secure-session.</p>
        <input type="text" id="ollama_session_cookie" placeholder="session cookie..." autocomplete="off">
      </div>

      <div class="settings-actions">
        <button class="btn-cancel" onclick="closeSettings()">Cancel</button>
        <button class="btn-save" onclick="saveSettings()">Save</button>
      </div>
    </div>
  </div>

  <!-- Toast -->
  <div class="toast" id="toast"></div>

  <script>
    const PROVIDER_LABELS = {
      anthropic: 'Anthropic',
      claude: 'Claude',
      gemini: 'Gemini',
      ollama: 'Ollama',
      openai: 'OpenAI',
    };

    const ERROR_ICONS = {
      auth_expired: '🔐',
      timeout: '⏱️',
      network_error: '🌐',
      script_missing: '⚠️',
      node_missing: '⚠️',
      parse_error: '❌',
      no_output: '❌',
      subprocess_error: '❌',
      spawn_error: '❌',
    };

    const ERROR_MESSAGES = {
      auth_expired: 'Credential expired or invalid',
      timeout: 'Request timed out',
      network_error: 'Network error',
      script_missing: 'Script not found',
      node_missing: 'Node.js not found',
      parse_error: 'Invalid response',
      no_output: 'No data received',
      subprocess_error: 'Process error',
      spawn_error: 'Could not start process',
    };

    function getLevelClass(percentage) {
      if (percentage > 80) return 'high';
      if (percentage >= 50) return 'medium';
      return 'low';
    }

    function formatResetTime(hours) {
      if (hours === null || hours === undefined) return null;
      const days = Math.floor(hours / 24);
      const h = hours % 24;
      if (days > 0) return days + 'd ' + h + 'h';
      return h + 'h';
    }

    function formatTime(isoString) {
      if (!isoString) return null;
      try {
        const d = new Date(isoString);
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');
        return hours + ':' + minutes;
      } catch {
        return null;
      }
    }

    async function fetchStatus() {
      const btn = document.getElementById('refreshBtn');
      btn.classList.add('spinning');
      btn.disabled = true;

      try {
        const res = await fetch('/api/status');
        const data = await res.json();
        renderStatus(data);
      } catch (err) {
        document.getElementById('statusContent').innerHTML =
          '<p class="status-message">Failed to load data: ' + escapeHtml(err.message) + '</p>';
        document.getElementById('panelLabel').textContent = 'ERR';
        document.getElementById('panelLabel').className = 'panel-label error';
      } finally {
        btn.classList.remove('spinning');
        btn.disabled = false;
      }
    }

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    function renderStatus(data) {
      const providers = Object.keys(data.providers);
      const content = document.getElementById('statusContent');
      const label = document.getElementById('panelLabel');

      if (providers.length === 0) {
        label.textContent = '--';
        label.className = 'panel-label none';
        content.innerHTML = '<div class="no-providers">No providers configured. <a onclick="openSettings()">Open Settings</a> to add credentials.</div>';
        return;
      }

      let maxPercentage = 0;
      let hasSuccess = false;
      let html = '';

      for (const provider of providers) {
        const providerData = data.providers[provider];
        const providerLabel = PROVIDER_LABELS[provider] || provider;

        const isApi = providerData.data?.plan === 'api';
        const planLabel = isApi ? 'Pay-as-you-go' : 'Subscription';

        html += '<div class="provider-section">';
        html += '<div class="provider-header">' + 
                '<span>' + escapeHtml(providerLabel) + '</span>' +
                '<span class="plan-badge">' + planLabel + '</span>' +
                '</div>';
        html += '<div class="provider-content">';

        if (providerData.status === 'error') {
          const errorCode = providerData.error?.code || 'unknown';
          const errorMsg = ERROR_MESSAGES[errorCode] || providerData.error?.message || 'Unknown error';
          const errorIcon = ERROR_ICONS[errorCode] || '❌';

          html += '<div class="error-row">';
          html += '<span class="error-icon">' + errorIcon + '</span>';
          html += '<span class="error-message">' + escapeHtml(errorMsg) + '</span>';
          html += '</div>';
        } else if (providerData.data) {
          hasSuccess = true;
          if (providerData.data.overall_percentage > maxPercentage) {
            maxPercentage = providerData.data.overall_percentage;
          }

          if (providerData.data.tiers && providerData.data.tiers.length > 0) {
            for (const tier of providerData.data.tiers) {
              const level = getLevelClass(tier.percentage);
              html += '<div class="tier-row">';
              html += '<span class="tier-name">' + escapeHtml(tier.name) + '</span>';
              
              // Always show numbers for subscriptions OR if there is an actual percentage > 0
              // For API providers without usage (0%), show a checkmark instead of an empty 0% bar
              const hasBudget = providerData.data.overall_percentage > 0 || tier.percentage > 0;
              const isMainTier = tier.name.toLowerCase().includes('monthly') || tier.name.toLowerCase().includes('spend');
              
              if (!isApi || hasBudget || (isMainTier && tier.name.includes('$'))) {
                html += '<div class="bar-bg"><div class="bar-fill ' + level + '" style="width: ' + Math.min(tier.percentage, 100) + '%"></div></div>';
                html += '<span class="tier-percentage">' + Math.round(tier.percentage) + '%</span>';
              } else {
                html += '<div style="flex: 1"></div>';
                html += '<span class="tier-status-icon">✅</span>';
              }
              
              html += '</div>';
            }
          }

          if (providerData.data.reset_in_hours !== null && providerData.data.reset_in_hours !== undefined) {
            const resetStr = formatResetTime(providerData.data.reset_in_hours);
            if (resetStr) {
              html += '<div class="reset-info">Resets in ' + escapeHtml(resetStr) + '</div>';
            }
          }
        }

        html += '</div></div>';
      }

      // Last refresh time
      if (data.last_refresh) {
        const timeStr = formatTime(data.last_refresh);
        if (timeStr) {
          html += '<div class="last-refresh">Last updated: ' + escapeHtml(timeStr) + '</div>';
        }
      }

      content.innerHTML = html;

      if (hasSuccess) {
        label.textContent = Math.round(maxPercentage) + '%';
        label.className = 'panel-label ' + getLevelClass(maxPercentage);
      } else {
        label.textContent = 'ERR';
        label.className = 'panel-label error';
      }
    }

    function refreshData() {
      fetch('/api/refresh', { method: 'POST' })
        .then(() => fetchStatus())
        .catch(() => fetchStatus());
    }

    async function openSettings() {
      const overlay = document.getElementById('settingsOverlay');
      overlay.classList.add('active');

      try {
        const res = await fetch('/api/config');
        const data = await res.json();

        const fields = {
          anthropic_api_key: data.providers?.anthropic,
          claude_token: data.providers?.claude,
          gemini_api_key: data.providers?.gemini,
          openai_api_key: data.providers?.openai,
          ollama_session_cookie: data.providers?.ollama,
        };

        for (const [id, info] of Object.entries(fields)) {
          const input = document.getElementById(id);
          if (info) {
            // Show real value if saved in config
            input.value = info.isDefault ? '' : info.value;
            // Show env var value as placeholder
            if (info.defaultValue) {
              input.placeholder = info.defaultValue;
            }
          }
        }
      } catch {
        // Use default placeholders
      }
    }

    function closeSettings() {
      document.getElementById('settingsOverlay').classList.remove('active');
    }

    function closeSettingsOnOverlay(event) {
      if (event.target === event.currentTarget) {
        closeSettings();
      }
    }

    async function saveSettings() {
      const body = {};

      // Only send non-empty values (to not overwrite existing)
      const anthropicKey = document.getElementById('anthropic_api_key').value.trim();
      const claudeToken = document.getElementById('claude_token').value.trim();
      const geminiKey = document.getElementById('gemini_api_key').value.trim();
      const openaiKey = document.getElementById('openai_api_key').value.trim();
      const ollamaCookie = document.getElementById('ollama_session_cookie').value.trim();

      if (anthropicKey) body.anthropic_api_key = anthropicKey;
      if (claudeToken) body.claude_token = claudeToken;
      if (geminiKey) body.gemini_api_key = geminiKey;
      if (openaiKey) body.openai_api_key = openaiKey;
      if (ollamaCookie) body.ollama_session_cookie = ollamaCookie;

      try {
        const res = await fetch('/api/config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json();

        if (data.success) {
          showToast('Configuration saved', 'success');
          closeSettings();
          // Refresh data with new config
          await fetchStatus();
        } else {
          showToast(data.message || 'Failed to save', 'error');
        }
      } catch (err) {
        showToast('Failed to save: ' + err.message, 'error');
      }
    }

    function showToast(message, type) {
      const toast = document.getElementById('toast');
      toast.textContent = message;
      toast.className = 'toast show ' + (type || '');
      setTimeout(() => {
        toast.className = 'toast';
      }, 3000);
    }

    // Initial load
    fetchStatus();

    // Auto-refresh every 5 minutes
    setInterval(fetchStatus, 5 * 60 * 1000);
  </script>
</body>
</html>`
}
