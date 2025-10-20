
(function() {
  window.CallConnectButton = function(options) {
    this.options = Object.assign({
      buttonId: null,
      buttonElement: null,
      autoEnableVideo: true,
      autoEnableAudio: true,
      getUserName: null,
      onRoomCreated: null,
      onRoomJoined: null,
      onCallStarted: null,
      onCallEnded: null,
      onError: null,
      customUI: false,
      baseUrl: null,
      // New customization options
      promptPosition: 'overlay', // 'overlay', 'below', 'above', 'inline'
      promptStyle: {
        background: 'white',
        borderRadius: '12px',
        padding: '30px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
        maxWidth: '400px',
        width: '90%'
      },
      buttonStyle: {
        primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        secondary: '#e2e8f0',
        textColor: 'white'
      },
      showCreateButton: true,
      showJoinButton: true,
      showCodeInput: true,
      autoFocusInput: true,
      closeOnBackdropClick: true,
      customPromptHTML: null,
      customCallHTML: null,
      enableCopyButton: true,
      inputPlaceholder: 'Enter room code',
      createButtonText: 'Create New Room',
      joinButtonText: 'Join Room',
      closeButtonText: '×'
    }, options);

    this.iframe = null;
    this.isCallActive = false;
    this.currentRoomCode = null;
    
    if (!this.options.baseUrl) {
      const scripts = document.getElementsByTagName('script');
      for (let script of scripts) {
        if (script.src && script.src.includes('embed-button.js')) {
          const url = new URL(script.src);
          this.options.baseUrl = url.origin + url.pathname.replace('/embed-button.js', '');
          break;
        }
      }
    }
    
    if (!this.options.baseUrl) {
      this.options.baseUrl = 'https://cartier-app.github.io/webrtc';
    }

    this.init();
  };

  CallConnectButton.prototype.init = function() {
    const button = this.options.buttonElement || document.getElementById(this.options.buttonId);
    
    if (!button) {
      console.error('CallConnect Button: Button element not found');
      return;
    }

    button.addEventListener('click', () => {
      this.startCall();
    });
  };

  CallConnectButton.prototype.getPromptStyles = function() {
    const style = this.options.promptStyle;
    return Object.keys(style).map(key => {
      const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `${cssKey}: ${style[key]}`;
    }).join('; ');
  };

  CallConnectButton.prototype.attachPromptEvents = function(container, username, roomCode) {
    const closeBtn = container.querySelector('.callconnect-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        container.remove();
      });
    }

    if (!roomCode) {
      const createBtn = container.querySelector('#callconnect-create-room');
      if (createBtn) {
        createBtn.addEventListener('click', () => {
          this.createRoom(username, (code) => {
            if (this.options.enableCopyButton) {
              this.showCopyableCode(container, code);
            }
          });
          if (!this.options.enableCopyButton) {
            container.remove();
          }
        });
      }

      const roomInput = container.querySelector('#callconnect-room-input');
      if (roomInput) {
        if (this.options.autoFocusInput) {
          setTimeout(() => roomInput.focus(), 100);
        }
        roomInput.addEventListener('input', (e) => {
          e.target.value = e.target.value.toUpperCase();
        });
        roomInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            const joinBtn = container.querySelector('#callconnect-join-room');
            if (joinBtn) joinBtn.click();
          }
        });
      }

      const joinBtn = container.querySelector('#callconnect-join-room');
      if (joinBtn) {
        joinBtn.addEventListener('click', () => {
          const input = container.querySelector('#callconnect-room-input');
          const code = input ? input.value.trim() : '';
          if (code) {
            this.joinRoom(code, username);
            container.remove();
          } else {
            alert('Please enter a room code');
          }
        });
      }
    } else {
      this.joinRoom(roomCode, username);
      container.remove();
    }
  };

  CallConnectButton.prototype.showCopyableCode = function(container, roomCode) {
    const promptBody = container.querySelector('.callconnect-prompt-body');
    if (promptBody) {
      promptBody.innerHTML = `
        <div style="text-align: center;">
          <h3 style="margin: 0 0 15px 0; color: #10b981;">Room Created!</h3>
          <p style="margin-bottom: 20px;">Share this code with others:</p>
          <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <div style="font-size: 32px; font-weight: 800; letter-spacing: 3px; color: #667eea; margin-bottom: 10px;">${roomCode}</div>
            <button class="callconnect-btn callconnect-btn-primary" id="callconnect-copy-code" style="background: ${this.options.buttonStyle.primary}; color: ${this.options.buttonStyle.textColor};">📋 Copy Code</button>
          </div>
          <p style="font-size: 14px; color: #666;">The call window will open automatically...</p>
        </div>
      `;

      const copyBtn = promptBody.querySelector('#callconnect-copy-code');
      if (copyBtn) {
        copyBtn.addEventListener('click', () => {
          navigator.clipboard.writeText(roomCode).then(() => {
            copyBtn.textContent = '✓ Copied!';
            copyBtn.style.background = '#10b981';
            setTimeout(() => {
              copyBtn.textContent = '📋 Copy Code';
              copyBtn.style.background = this.options.buttonStyle.primary;
            }, 2000);
          });
        });
      }

      setTimeout(() => {
        container.remove();
      }, 5000);
    }
  };

  CallConnectButton.prototype.startCall = function(roomCode = null) {
    if (this.isCallActive) {
      return;
    }

    const username = this.options.getUserName ? this.options.getUserName() : 'Guest';

    if (this.options.customUI) {
      this.showCustomPrompt(username, roomCode);
    } else {
      this.showDefaultPrompt(username, roomCode);
    }
  };

  CallConnectButton.prototype.showDefaultPrompt = function(username, roomCode) {
    const opts = this.options;
    
    if (opts.customPromptHTML) {
      const customContainer = document.createElement('div');
      customContainer.innerHTML = opts.customPromptHTML;
      document.body.appendChild(customContainer);
      this.attachPromptEvents(customContainer, username, roomCode);
      return;
    }

    const overlay = document.createElement('div');
    
    if (opts.promptPosition === 'overlay') {
      overlay.className = 'callconnect-overlay';
      if (opts.closeOnBackdropClick) {
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) overlay.remove();
        });
      }
    } else {
      overlay.className = 'callconnect-inline-prompt';
      overlay.style.position = 'relative';
      overlay.style.display = 'inline-block';
    }

    const promptHTML = `
      <div class="callconnect-prompt" style="${this.getPromptStyles()}">
        <div class="callconnect-prompt-header">
          <h3>Start Video Call</h3>
          <button class="callconnect-close">${opts.closeButtonText}</button>
        </div>
        <div class="callconnect-prompt-body">
          <p>Calling as: <strong>${username}</strong></p>
          ${roomCode ? '' : `
            <div class="callconnect-options">
              ${opts.showCreateButton ? `<button class="callconnect-btn callconnect-btn-primary" id="callconnect-create-room" style="background: ${opts.buttonStyle.primary}; color: ${opts.buttonStyle.textColor};">${opts.createButtonText}</button>` : ''}
              ${opts.showCreateButton && opts.showJoinButton ? '<div class="callconnect-divider">or</div>' : ''}
              ${opts.showCodeInput ? `<input type="text" id="callconnect-room-input" placeholder="${opts.inputPlaceholder}" maxlength="6" style="text-transform: uppercase;">` : ''}
              ${opts.showJoinButton ? `<button class="callconnect-btn callconnect-btn-secondary" id="callconnect-join-room" style="background: ${opts.buttonStyle.secondary};">${opts.joinButtonText}</button>` : ''}
            </div>
          `}
        </div>
      </div>
    `;

    overlay.innerHTML = promptHTML;

    if (opts.promptPosition === 'below' || opts.promptPosition === 'above') {
      const button = this.options.buttonElement || document.getElementById(this.options.buttonId);
      const parent = button.parentElement;
      if (opts.promptPosition === 'below') {
        parent.insertBefore(overlay, button.nextSibling);
      } else {
        parent.insertBefore(overlay, button);
      }
    } else if (opts.promptPosition === 'inline') {
      const button = this.options.buttonElement || document.getElementById(this.options.buttonId);
      button.parentElement.appendChild(overlay);
    } else {
      document.body.appendChild(overlay);
    }

    this.attachPromptEvents(overlay, username, roomCode);

    if (!roomCode) {
      document.getElementById('callconnect-create-room').addEventListener('click', () => {
        this.createRoom(username);
        overlay.remove();
      });

      const roomInput = document.getElementById('callconnect-room-input');
      roomInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase();
      });

      document.getElementById('callconnect-join-room').addEventListener('click', () => {
        const code = roomInput.value.trim();
        if (code) {
          this.joinRoom(code, username);
          overlay.remove();
        } else {
          alert('Please enter a room code');
        }
      });
    } else {
      this.joinRoom(roomCode, username);
      overlay.remove();
    }
  };

  CallConnectButton.prototype.showCustomPrompt = function(username, roomCode) {
    if (this.options.onCallStarted) {
      this.options.onCallStarted({
        username: username,
        roomCode: roomCode,
        createRoom: (callback) => {
          this.createRoom(username, callback);
        },
        joinRoom: (code, callback) => {
          this.joinRoom(code, username, callback);
        }
      });
    }
  };

  CallConnectButton.prototype.createRoom = function(username, callback) {
    this.openCallWindow('create', username, null, callback);
  };

  CallConnectButton.prototype.joinRoom = function(roomCode, username, callback) {
    this.openCallWindow('join', username, roomCode, callback);
  };

  CallConnectButton.prototype.openCallWindow = function(action, username, roomCode, callback) {
    const overlay = document.createElement('div');
    overlay.className = 'callconnect-call-overlay';
    overlay.innerHTML = `
      <div class="callconnect-call-container">
        <div class="callconnect-call-header">
          <div class="callconnect-call-info">
            <span id="callconnect-call-status">Connecting...</span>
            <span id="callconnect-call-room" style="display: none;"></span>
          </div>
          <button class="callconnect-end-call" id="callconnect-end-call">End Call</button>
        </div>
        <div id="callconnect-call-frame"></div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.isCallActive = true;

    const params = new URLSearchParams({
      embed: 'true',
      mode: 'both',
      username: username,
      buttonMode: 'true',
      autoEnableVideo: this.options.autoEnableVideo,
      autoEnableAudio: this.options.autoEnableAudio
    });

    if (roomCode) {
      params.set('roomCode', roomCode);
      params.set('autoJoin', 'true');
    }

    this.iframe = document.createElement('iframe');
    this.iframe.src = `${this.options.baseUrl}/?${params.toString()}`;
    this.iframe.style.width = '100%';
    this.iframe.style.height = '100%';
    this.iframe.style.border = 'none';
    this.iframe.allow = 'camera; microphone; display-capture';

    document.getElementById('callconnect-call-frame').appendChild(this.iframe);

    window.addEventListener('message', (event) => {
      if (event.source !== this.iframe.contentWindow) return;

      const { type, data } = event.data;

      if (type === 'callconnect:joined') {
        this.currentRoomCode = data.roomCode;
        document.getElementById('callconnect-call-status').textContent = 'In Call';
        const roomDisplay = document.getElementById('callconnect-call-room');
        roomDisplay.textContent = `Room: ${data.roomCode}`;
        roomDisplay.style.display = 'inline';

        if (data.action === 'created' && this.options.onRoomCreated) {
          this.options.onRoomCreated(data.roomCode);
        }
        if (data.action === 'joined' && this.options.onRoomJoined) {
          this.options.onRoomJoined(data.roomCode);
        }
        if (callback) {
          callback(data.roomCode);
        }
      }

      if (type === 'callconnect:left') {
        this.endCall();
      }

      if (type === 'callconnect:error') {
        if (this.options.onError) {
          this.options.onError(data);
        }
      }
    });

    document.getElementById('callconnect-end-call').addEventListener('click', () => {
      this.endCall();
    });

    if (action === 'create') {
      setTimeout(() => {
        this.iframe.contentWindow.postMessage({
          type: 'callconnect:create',
          data: { username: username }
        }, this.options.baseUrl);
      }, 1000);
    }
  };

  CallConnectButton.prototype.endCall = function() {
    const overlay = document.querySelector('.callconnect-call-overlay');
    if (overlay) {
      overlay.remove();
    }

    if (this.iframe) {
      this.iframe.remove();
      this.iframe = null;
    }

    this.isCallActive = false;
    
    if (this.options.onCallEnded) {
      this.options.onCallEnded();
    }

    this.currentRoomCode = null;
  };

  CallConnectButton.prototype.destroy = function() {
    this.endCall();
  };
})();
