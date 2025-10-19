/**
 * CallConnect Embeddable SDK
 * Easy integration for video/audio calling in any web app
 */

(function(window) {
  'use strict';

  class CallConnectEmbed {
    constructor(config = {}) {
      const scriptElement = document.currentScript || document.querySelector('script[src*="embed.js"]');
      let defaultBaseUrl = 'https://cartier-app.github.io/webrtc';
      
      if (scriptElement && scriptElement.src) {
        try {
          const scriptUrl = new URL(scriptElement.src);
          const origin = scriptUrl.origin;
          const pathname = scriptUrl.pathname.substring(0, scriptUrl.pathname.lastIndexOf('/'));
          defaultBaseUrl = origin + pathname;
        } catch (e) {
          console.warn('Could not auto-detect baseUrl, using default GitHub Pages URL');
        }
      }
      
      this.config = {
        containerId: config.containerId || 'callconnect-container',
        mode: config.mode || 'both', // 'video', 'audio', 'both'
        theme: config.theme || 'light', // 'light', 'dark', 'custom'
        width: config.width || '100%',
        height: config.height || '600px',
        autoJoin: config.autoJoin || false,
        roomCode: config.roomCode || null,
        username: config.username || 'Guest',
        showControls: config.showControls !== false,
        position: config.position || 'inline', // 'inline', 'floating', 'modal'
        baseUrl: config.baseUrl || defaultBaseUrl,
        onReady: config.onReady || function() {},
        onJoin: config.onJoin || function() {},
        onLeave: config.onLeave || function() {},
        onError: config.onError || function() {}
      };

      this.iframe = null;
      this.container = null;
      this.isInitialized = false;
    }

    init() {
      const container = document.getElementById(this.config.containerId);
      if (!container) {
        console.error(`Container with id "${this.config.containerId}" not found`);
        this.config.onError(new Error('Container not found'));
        return;
      }

      this.container = container;
      this._createIframe();
      this._setupMessageListener();
      this.isInitialized = true;
      
      return this;
    }

    _createIframe() {
      const iframe = document.createElement('iframe');
      
      const params = new URLSearchParams({
        embed: 'true',
        mode: this.config.mode,
        theme: this.config.theme,
        controls: this.config.showControls,
        username: this.config.username
      });

      if (this.config.roomCode) {
        params.append('roomCode', this.config.roomCode);
      }

      if (this.config.autoJoin) {
        params.append('autoJoin', 'true');
      }

      const parentOrigin = window.location.origin;
      params.append('parentOrigin', parentOrigin);
      
      iframe.src = `${this.config.baseUrl}/?${params.toString()}`;
      iframe.style.width = this.config.width;
      iframe.style.height = this.config.height;
      iframe.style.border = 'none';
      iframe.style.borderRadius = '12px';
      iframe.allow = 'camera; microphone; display-capture';
      iframe.className = 'callconnect-iframe';

      if (this.config.position === 'floating') {
        iframe.style.position = 'fixed';
        iframe.style.bottom = '20px';
        iframe.style.right = '20px';
        iframe.style.zIndex = '9999';
        iframe.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.2)';
      } else if (this.config.position === 'modal') {
        this._createModal(iframe);
        return;
      }

      this.iframe = iframe;
      this.container.appendChild(iframe);
    }

    _createModal(iframe) {
      const modal = document.createElement('div');
      modal.className = 'callconnect-modal';
      modal.style.cssText = `
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 10000;
        align-items: center;
        justify-content: center;
      `;

      const modalContent = document.createElement('div');
      modalContent.style.cssText = `
        position: relative;
        width: 90%;
        max-width: 1200px;
        height: 80%;
        background: white;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      `;

      const closeBtn = document.createElement('button');
      closeBtn.innerHTML = '&times;';
      closeBtn.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        width: 40px;
        height: 40px;
        border: none;
        background: rgba(255, 255, 255, 0.9);
        border-radius: 50%;
        font-size: 24px;
        cursor: pointer;
        z-index: 1;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      `;
      closeBtn.onclick = () => this.hide();

      iframe.style.width = '100%';
      iframe.style.height = '100%';

      modalContent.appendChild(iframe);
      modalContent.appendChild(closeBtn);
      modal.appendChild(modalContent);
      
      this.modal = modal;
      this.iframe = iframe;
      document.body.appendChild(modal);
    }

    _setupMessageListener() {
      const allowedOrigin = new URL(this.config.baseUrl).origin;
      
      window.addEventListener('message', (event) => {
        if (event.origin !== allowedOrigin) return;

        const { type, data } = event.data;

        switch(type) {
          case 'callconnect:ready':
            this.config.onReady(data);
            break;
          case 'callconnect:joined':
            this.config.onJoin(data);
            break;
          case 'callconnect:left':
            this.config.onLeave(data);
            break;
          case 'callconnect:error':
            this.config.onError(data);
            break;
        }
      });
    }

    show() {
      if (this.config.position === 'modal' && this.modal) {
        this.modal.style.display = 'flex';
      }
    }

    hide() {
      if (this.config.position === 'modal' && this.modal) {
        this.modal.style.display = 'none';
      }
    }

    joinRoom(roomCode, username) {
      if (!this.iframe) return;
      
      const targetOrigin = new URL(this.config.baseUrl).origin;
      this.iframe.contentWindow.postMessage({
        type: 'callconnect:join',
        data: { roomCode, username: username || this.config.username }
      }, targetOrigin);
    }

    createRoom(username) {
      if (!this.iframe) return;
      
      const targetOrigin = new URL(this.config.baseUrl).origin;
      this.iframe.contentWindow.postMessage({
        type: 'callconnect:create',
        data: { username: username || this.config.username }
      }, targetOrigin);
    }

    leaveRoom() {
      if (!this.iframe) return;
      
      const targetOrigin = new URL(this.config.baseUrl).origin;
      this.iframe.contentWindow.postMessage({
        type: 'callconnect:leave',
        data: {}
      }, targetOrigin);
    }

    toggleVideo(enabled) {
      if (!this.iframe) return;
      
      const targetOrigin = new URL(this.config.baseUrl).origin;
      this.iframe.contentWindow.postMessage({
        type: 'callconnect:toggleVideo',
        data: { enabled }
      }, targetOrigin);
    }

    toggleAudio(enabled) {
      if (!this.iframe) return;
      
      const targetOrigin = new URL(this.config.baseUrl).origin;
      this.iframe.contentWindow.postMessage({
        type: 'callconnect:toggleAudio',
        data: { enabled }
      }, targetOrigin);
    }

    destroy() {
      if (this.iframe) {
        this.iframe.remove();
        this.iframe = null;
      }
      if (this.modal) {
        this.modal.remove();
        this.modal = null;
      }
      this.isInitialized = false;
    }
  }

  window.CallConnectEmbed = CallConnectEmbed;

  if (window.callConnectAutoInit) {
    const embed = new CallConnectEmbed(window.callConnectConfig || {});
    embed.init();
    window.callConnectInstance = embed;
  }

})(window);
