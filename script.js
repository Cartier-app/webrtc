const SUPABASE_URL = window.CALLCONNECT_CONFIG?.SUPABASE_URL || 'SUPABASE_URL_PLACEHOLDER';
const SUPABASE_ANON_KEY = window.CALLCONNECT_CONFIG?.SUPABASE_ANON_KEY || 'SUPABASE_ANON_KEY_PLACEHOLDER';

if (!window.CALLCONNECT_CONFIG || SUPABASE_URL === 'YOUR_SUPABASE_URL_HERE' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY_HERE' || SUPABASE_URL === 'SUPABASE_URL_PLACEHOLDER') {
  const errorMsg = '⚠️ Supabase credentials not configured! Please edit config.js with your Supabase URL and anonymous key.';
  console.error(errorMsg);
  
  if (document.getElementById('errorMessage')) {
    document.getElementById('errorMessage').textContent = errorMsg + ' Check the browser console for more details.';
    if (typeof switchScreen === 'function') {
      switchScreen('errorScreen');
    }
  }
}

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { 
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ]
};

class WebRTCManager {
  constructor() {
    this.localStream = null;
    this.peerConnections = new Map();
    this.remoteStreams = new Map();
    this.connectionQuality = new Map();
    this.qualityMonitoringIntervals = new Map();
    this.currentRoom = null;
    this.currentPeerId = null;
    this.username = null;
    this.signalingChannel = null;
    this.roomChannel = null;
    this.isVideoEnabled = true;
    this.isAudioEnabled = true;
    this.pendingIceCandidates = new Map();
    this.reconnectionAttempts = new Map();
    this.reconnectionTimeouts = new Map();
    this.maxReconnectionAttempts = 5;
  }

  generatePeerId() {
    return `peer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateRoomCode() {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
  }

  async createRoom(username, enableVideo, enableAudio) {
    try {
      this.username = username;
      this.currentPeerId = this.generatePeerId();
      this.isVideoEnabled = enableVideo;
      this.isAudioEnabled = enableAudio;

      const roomCode = this.generateRoomCode();
      
      const { data: room, error } = await supabaseClient
        .from('rooms')
        .insert({
          room_code: roomCode,
          is_active: true,
          max_participants: 10
        })
        .select()
        .single();

      if (error) throw error;

      this.currentRoom = room;
      await this.joinRoomSignaling(room.id, roomCode);
      
      showStatus(`Room created: ${roomCode}`, 'success');
      return roomCode;
    } catch (error) {
      console.error('Error creating room:', error);
      throw new Error(`Failed to create room: ${error.message}`);
    }
  }

  async joinRoom(roomCode, username, enableVideo, enableAudio) {
    try {
      this.username = username;
      this.currentPeerId = this.generatePeerId();
      this.isVideoEnabled = enableVideo;
      this.isAudioEnabled = enableAudio;

      const { data: room, error } = await supabaseClient
        .from('rooms')
        .select('*')
        .eq('room_code', roomCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !room) {
        throw new Error('Room not found or is no longer active');
      }

      this.currentRoom = room;
      await this.joinRoomSignaling(room.id, roomCode);
      
      showStatus(`Joined room: ${roomCode}`, 'success');
      return roomCode;
    } catch (error) {
      console.error('Error joining room:', error);
      throw new Error(`Failed to join room: ${error.message}`);
    }
  }

  async joinRoomSignaling(roomId, roomCode) {
    await this.initializeLocalStream();
    
    const { error: insertError } = await supabaseClient
      .from('participants')
      .insert({
        room_id: roomId,
        user_id: this.username,
        peer_id: this.currentPeerId,
        username: this.username,
        is_video_enabled: this.isVideoEnabled,
        is_audio_enabled: this.isAudioEnabled
      });

    if (insertError) {
      console.error('Error inserting participant:', insertError);
    }

    this.setupSignalingChannel(roomId);
    this.setupRoomChannel(roomId);
    
    const { data: existingParticipants } = await supabaseClient
      .from('participants')
      .select('*')
      .eq('room_id', roomId)
      .neq('peer_id', this.currentPeerId);

    if (existingParticipants && existingParticipants.length > 0) {
      for (const participant of existingParticipants) {
        await this.createPeerConnection(participant.peer_id, true);
      }
    }

    this.startHeartbeat();
  }

  setupSignalingChannel(roomId) {
    this.signalingChannel = supabaseClient.channel(`signaling:${roomId}`, {
      config: { broadcast: { self: false } }
    });

    this.signalingChannel
      .on('broadcast', { event: 'offer' }, async (payload) => {
        const { from, to, sdp } = payload.payload;
        if (to === this.currentPeerId) {
          await this.handleOffer(from, sdp);
        }
      })
      .on('broadcast', { event: 'answer' }, async (payload) => {
        const { from, to, sdp } = payload.payload;
        if (to === this.currentPeerId) {
          await this.handleAnswer(from, sdp);
        }
      })
      .on('broadcast', { event: 'ice-candidate' }, async (payload) => {
        const { from, to, candidate } = payload.payload;
        if (to === this.currentPeerId) {
          await this.handleIceCandidate(from, candidate);
        }
      })
      .subscribe();
  }

  setupRoomChannel(roomId) {
    this.roomChannel = supabaseClient.channel(`room:${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'participants',
        filter: `room_id=eq.${roomId}`
      }, async (payload) => {
        const newParticipant = payload.new;
        if (newParticipant.peer_id !== this.currentPeerId) {
          console.log('New participant joined:', newParticipant.username);
          showStatus(`${newParticipant.username} joined`, 'info');
          updateParticipantsList();
        }
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'participants',
        filter: `room_id=eq.${roomId}`
      }, (payload) => {
        const leftParticipant = payload.old;
        if (leftParticipant.peer_id !== this.currentPeerId) {
          console.log('Participant left:', leftParticipant.username);
          showStatus(`${leftParticipant.username} left`, 'info');
          this.removePeerConnection(leftParticipant.peer_id);
          updateParticipantsList();
        }
      })
      .subscribe();
  }

  async initializeLocalStream() {
    try {
      const constraints = {
        video: this.isVideoEnabled ? { width: 1280, height: 720 } : false,
        audio: this.isAudioEnabled
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      const localVideo = document.getElementById('localVideo');
      localVideo.srcObject = this.localStream;

      if (!this.isVideoEnabled) {
        localVideo.style.display = 'none';
      }
      if (!this.isAudioEnabled) {
        this.localStream.getAudioTracks().forEach(track => track.enabled = false);
      }
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw new Error('Could not access camera/microphone. Please grant permissions.');
    }
  }

  async createPeerConnection(remotePeerId, initiator) {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    this.peerConnections.set(remotePeerId, pc);
    this.reconnectionAttempts.set(remotePeerId, 0);

    this.localStream.getTracks().forEach(track => {
      pc.addTrack(track, this.localStream);
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendIceCandidate(remotePeerId, event.candidate);
      }
    };

    pc.ontrack = (event) => {
      console.log(`Received track from ${remotePeerId}:`, event.track.kind);
      
      let stream = this.remoteStreams.get(remotePeerId);
      if (!stream) {
        stream = new MediaStream();
        this.remoteStreams.set(remotePeerId, stream);
      }
      
      stream.addTrack(event.track);
      this.handleRemoteTrack(remotePeerId, stream);
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`ICE connection state for ${remotePeerId}:`, pc.iceConnectionState);
      this.handleConnectionStateChange(remotePeerId);
    };

    pc.onconnectionstatechange = () => {
      console.log(`Connection state for ${remotePeerId}:`, pc.connectionState);
      this.handleConnectionStateChange(remotePeerId);
    };

    pc.onicegatheringstatechange = () => {
      console.log(`ICE gathering state for ${remotePeerId}:`, pc.iceGatheringState);
    };

    if (initiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      this.sendOffer(remotePeerId, offer);
    }

    setTimeout(() => {
      this.startQualityMonitoring(remotePeerId);
    }, 2000);

    return pc;
  }

  async handleConnectionStateChange(remotePeerId) {
    const pc = this.peerConnections.get(remotePeerId);
    if (!pc) return;

    const iceState = pc.iceConnectionState;
    const connState = pc.connectionState;

    if (iceState === 'connected' || connState === 'connected') {
      this.reconnectionAttempts.set(remotePeerId, 0);
      if (this.reconnectionTimeouts.has(remotePeerId)) {
        clearTimeout(this.reconnectionTimeouts.get(remotePeerId));
        this.reconnectionTimeouts.delete(remotePeerId);
      }
      console.log(`Connection established with ${remotePeerId}`);
      showStatus('Connection established', 'success');
      return;
    }

    if (iceState === 'disconnected' && connState !== 'failed') {
      console.log(`Connection temporarily disconnected with ${remotePeerId}, attempting to recover...`);
      showStatus('Connection interrupted, reconnecting...', 'info');
      
      if (this.reconnectionTimeouts.has(remotePeerId)) {
        return;
      }

      const timeout = setTimeout(async () => {
        this.reconnectionTimeouts.delete(remotePeerId);
        
        const currentPc = this.peerConnections.get(remotePeerId);
        if (!currentPc) return;

        if (currentPc.iceConnectionState === 'disconnected' || currentPc.connectionState === 'disconnected') {
          console.log(`Attempting ICE restart for ${remotePeerId}`);
          await this.attemptReconnection(remotePeerId);
        }
      }, 3000);

      this.reconnectionTimeouts.set(remotePeerId, timeout);
      return;
    }

    if (iceState === 'failed' || connState === 'failed') {
      console.log(`Connection failed with ${remotePeerId}, attempting to reconnect...`);
      showStatus('Connection lost, attempting to reconnect...', 'error');
      await this.attemptReconnection(remotePeerId);
    }
  }

  async attemptReconnection(remotePeerId) {
    const pc = this.peerConnections.get(remotePeerId);
    if (!pc) return;

    const attempts = this.reconnectionAttempts.get(remotePeerId) || 0;
    
    if (attempts >= this.maxReconnectionAttempts) {
      console.log(`Max reconnection attempts reached for ${remotePeerId}, removing peer`);
      showStatus('Unable to reconnect, peer removed', 'error');
      this.removePeerConnection(remotePeerId);
      return;
    }

    this.reconnectionAttempts.set(remotePeerId, attempts + 1);
    console.log(`Reconnection attempt ${attempts + 1}/${this.maxReconnectionAttempts} for ${remotePeerId}`);

    try {
      const offer = await pc.createOffer({ iceRestart: true });
      await pc.setLocalDescription(offer);
      this.sendOffer(remotePeerId, offer);
      
      console.log(`ICE restart offer sent to ${remotePeerId}`);
      
      const backoffDelay = Math.min(2000 * Math.pow(1.5, attempts), 8000);
      const recheckTimeout = setTimeout(() => {
        this.reconnectionTimeouts.delete(remotePeerId);
        
        const currentPc = this.peerConnections.get(remotePeerId);
        if (!currentPc) return;
        
        const iceState = currentPc.iceConnectionState;
        const connState = currentPc.connectionState;
        
        if (iceState === 'disconnected' || iceState === 'failed' || connState === 'disconnected' || connState === 'failed') {
          console.log(`Connection still in bad state (${iceState}/${connState}) after attempt ${attempts + 1}, retrying...`);
          this.attemptReconnection(remotePeerId);
        } else {
          console.log(`Connection recovered for ${remotePeerId}`);
        }
      }, backoffDelay);
      
      this.reconnectionTimeouts.set(remotePeerId, recheckTimeout);
    } catch (error) {
      console.error(`Failed to create reconnection offer for ${remotePeerId}:`, error);
      
      const backoffDelay = Math.min(1000 * Math.pow(2, attempts), 10000);
      const retryTimeout = setTimeout(() => {
        this.reconnectionTimeouts.delete(remotePeerId);
        if (this.peerConnections.has(remotePeerId)) {
          this.attemptReconnection(remotePeerId);
        }
      }, backoffDelay);
      
      this.reconnectionTimeouts.set(remotePeerId, retryTimeout);
    }
  }

  async monitorConnectionQuality(peerId) {
    const pc = this.peerConnections.get(peerId);
    if (!pc || pc.connectionState !== 'connected') {
      return null;
    }

    try {
      const stats = await pc.getStats(null);
      let quality = {
        packetLoss: 0,
        jitter: 0,
        rtt: 0,
        level: 'excellent'
      };

      stats.forEach(report => {
        if (report.type === 'inbound-rtp' && report.kind === 'video') {
          const packetsReceived = report.packetsReceived || 0;
          const packetsLost = report.packetsLost || 0;
          const totalPackets = packetsReceived + packetsLost;
          
          if (totalPackets > 0) {
            quality.packetLoss = (packetsLost / totalPackets) * 100;
          }
          
          quality.jitter = (report.jitter || 0) * 1000;
        }

        if (report.type === 'remote-inbound-rtp') {
          quality.rtt = (report.roundTripTime || 0) * 1000;
        }
      });

      if (quality.packetLoss > 5 || quality.jitter > 50 || quality.rtt > 300) {
        quality.level = 'poor';
      } else if (quality.packetLoss > 2 || quality.jitter > 30 || quality.rtt > 150) {
        quality.level = 'fair';
      } else {
        quality.level = 'excellent';
      }

      this.connectionQuality.set(peerId, quality);
      this.updateQualityIndicator(peerId, quality.level);
      
      return quality;
    } catch (error) {
      console.error('Error monitoring quality:', error);
      return null;
    }
  }

  startQualityMonitoring(peerId) {
    if (this.qualityMonitoringIntervals.has(peerId)) {
      return;
    }

    const interval = setInterval(async () => {
      const pc = this.peerConnections.get(peerId);
      if (!pc || pc.connectionState === 'closed' || pc.connectionState === 'failed') {
        this.stopQualityMonitoring(peerId);
        return;
      }
      await this.monitorConnectionQuality(peerId);
    }, 1500);

    this.qualityMonitoringIntervals.set(peerId, interval);
  }

  stopQualityMonitoring(peerId) {
    const interval = this.qualityMonitoringIntervals.get(peerId);
    if (interval) {
      clearInterval(interval);
      this.qualityMonitoringIntervals.delete(peerId);
    }
    this.connectionQuality.delete(peerId);
  }

  updateQualityIndicator(peerId, level) {
    const videoContainer = document.getElementById(`video-${peerId}`);
    if (!videoContainer) return;

    let indicator = videoContainer.querySelector('.quality-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.className = 'quality-indicator';
      videoContainer.appendChild(indicator);
    }

    indicator.className = `quality-indicator ${level}`;
    
    const bars = 3;
    let barsHTML = '';
    const activeBars = level === 'excellent' ? 3 : level === 'fair' ? 2 : 1;
    
    for (let i = 0; i < bars; i++) {
      barsHTML += `<div class="signal-bar ${i < activeBars ? 'active' : ''}"></div>`;
    }
    
    indicator.innerHTML = `
      <div class="signal-bars">${barsHTML}</div>
      <span class="quality-text">${level === 'excellent' ? 'Excellent' : level === 'fair' ? 'Fair' : 'Poor'}</span>
    `;

    this.updateHealthPanel(peerId, level);
  }

  async updateHealthPanel(peerId, level) {
    const healthList = document.getElementById('connectionHealthList');
    if (!healthList) return;

    const placeholder = healthList.querySelector('.health-placeholder');
    if (placeholder) {
      placeholder.remove();
    }

    const quality = this.connectionQuality.get(peerId);
    if (!quality) return;

    let healthItem = document.getElementById(`health-${peerId}`);
    
    const { data: participant } = await supabaseClient
      .from('participants')
      .select('username')
      .eq('peer_id', peerId)
      .single();

    const username = participant ? participant.username : 'Remote User';

    const activeBars = level === 'excellent' ? 3 : level === 'fair' ? 2 : 1;
    let barsHTML = '';
    for (let i = 0; i < 3; i++) {
      barsHTML += `<div class="health-signal-bar ${i < activeBars ? 'active' : ''}"></div>`;
    }

    const itemHTML = `
      <div class="health-item-header">
        <div class="health-username">${username}</div>
        <div class="health-status ${level}">
          <div class="health-signal-bars">${barsHTML}</div>
          <span>${level === 'excellent' ? 'Excellent' : level === 'fair' ? 'Fair' : 'Poor'}</span>
        </div>
      </div>
      <div class="health-metrics">
        <div class="health-metric">
          <div class="health-metric-label">Packet Loss</div>
          <div class="health-metric-value">${quality.packetLoss.toFixed(1)}%</div>
        </div>
        <div class="health-metric">
          <div class="health-metric-label">Jitter</div>
          <div class="health-metric-value">${quality.jitter.toFixed(0)}ms</div>
        </div>
        <div class="health-metric">
          <div class="health-metric-label">RTT</div>
          <div class="health-metric-value">${quality.rtt.toFixed(0)}ms</div>
        </div>
      </div>
    `;

    if (!healthItem) {
      healthItem = document.createElement('div');
      healthItem.id = `health-${peerId}`;
      healthItem.className = `health-item ${level}`;
      healthList.appendChild(healthItem);
    } else {
      healthItem.className = `health-item ${level}`;
    }

    healthItem.innerHTML = itemHTML;
  }

  async handleOffer(fromPeerId, offer) {
    let pc = this.peerConnections.get(fromPeerId);
    if (!pc) {
      pc = await this.createPeerConnection(fromPeerId, false);
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      
      if (this.pendingIceCandidates.has(fromPeerId)) {
        const candidates = this.pendingIceCandidates.get(fromPeerId);
        console.log(`Adding ${candidates.length} buffered ICE candidates for ${fromPeerId}`);
        for (const candidate of candidates) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (error) {
            console.error('Error adding buffered ICE candidate:', error);
          }
        }
        this.pendingIceCandidates.delete(fromPeerId);
      }
      
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      this.sendAnswer(fromPeerId, answer);
    } catch (error) {
      console.error('Error handling offer:', error);
      throw error;
    }
  }

  async handleAnswer(fromPeerId, answer) {
    const pc = this.peerConnections.get(fromPeerId);
    if (pc) {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        
        if (this.pendingIceCandidates.has(fromPeerId)) {
          const candidates = this.pendingIceCandidates.get(fromPeerId);
          console.log(`Adding ${candidates.length} buffered ICE candidates for ${fromPeerId}`);
          for (const candidate of candidates) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (error) {
              console.error('Error adding buffered ICE candidate:', error);
            }
          }
          this.pendingIceCandidates.delete(fromPeerId);
        }
      } catch (error) {
        console.error('Error handling answer:', error);
        throw error;
      }
    }
  }

  async handleIceCandidate(fromPeerId, candidate) {
    const pc = this.peerConnections.get(fromPeerId);
    if (pc) {
      try {
        if (pc.remoteDescription && pc.remoteDescription.type) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          console.log(`Buffering ICE candidate for ${fromPeerId} (remote description not set yet)`);
          if (!this.pendingIceCandidates.has(fromPeerId)) {
            this.pendingIceCandidates.set(fromPeerId, []);
          }
          this.pendingIceCandidates.get(fromPeerId).push(candidate);
        }
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    }
  }

  sendOffer(toPeerId, offer) {
    this.signalingChannel.send({
      type: 'broadcast',
      event: 'offer',
      payload: {
        from: this.currentPeerId,
        to: toPeerId,
        sdp: offer
      }
    });
  }

  sendAnswer(toPeerId, answer) {
    this.signalingChannel.send({
      type: 'broadcast',
      event: 'answer',
      payload: {
        from: this.currentPeerId,
        to: toPeerId,
        sdp: answer
      }
    });
  }

  sendIceCandidate(toPeerId, candidate) {
    this.signalingChannel.send({
      type: 'broadcast',
      event: 'ice-candidate',
      payload: {
        from: this.currentPeerId,
        to: toPeerId,
        candidate: candidate
      }
    });
  }

  handleRemoteTrack(peerId, stream) {
    let videoContainer = document.getElementById(`video-${peerId}`);
    
    if (!videoContainer) {
      const videoGrid = document.getElementById('videoGrid');
      videoContainer = document.createElement('div');
      videoContainer.id = `video-${peerId}`;
      videoContainer.className = 'video-container';
      
      const video = document.createElement('video');
      video.autoplay = true;
      video.playsinline = true;
      video.srcObject = stream;
      
      const label = document.createElement('div');
      label.className = 'video-label';
      label.textContent = 'Remote User';
      
      videoContainer.appendChild(video);
      videoContainer.appendChild(label);
      videoGrid.appendChild(videoContainer);

      supabaseClient
        .from('participants')
        .select('username')
        .eq('peer_id', peerId)
        .single()
        .then(({ data }) => {
          if (data) {
            label.textContent = data.username;
          }
        });
    } else {
      const video = videoContainer.querySelector('video');
      video.srcObject = stream;
    }
  }

  removePeerConnection(peerId) {
    this.stopQualityMonitoring(peerId);

    if (this.reconnectionTimeouts.has(peerId)) {
      clearTimeout(this.reconnectionTimeouts.get(peerId));
      this.reconnectionTimeouts.delete(peerId);
    }
    
    this.reconnectionAttempts.delete(peerId);
    this.pendingIceCandidates.delete(peerId);

    const pc = this.peerConnections.get(peerId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(peerId);
    }

    const stream = this.remoteStreams.get(peerId);
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      this.remoteStreams.delete(peerId);
    }

    const videoContainer = document.getElementById(`video-${peerId}`);
    if (videoContainer) {
      videoContainer.remove();
    }

    const healthItem = document.getElementById(`health-${peerId}`);
    if (healthItem) {
      healthItem.remove();
    }

    const healthList = document.getElementById('connectionHealthList');
    if (healthList && healthList.children.length === 0) {
      healthList.innerHTML = '<div class="health-placeholder">Connection quality will appear here once participants join...</div>';
    }
  }

  toggleVideo() {
    if (this.localStream) {
      const videoTracks = this.localStream.getVideoTracks();
      if (videoTracks.length > 0) {
        this.isVideoEnabled = !this.isVideoEnabled;
        videoTracks.forEach(track => {
          track.enabled = this.isVideoEnabled;
        });
        
        const localVideo = document.getElementById('localVideo');
        if (this.isVideoEnabled) {
          localVideo.style.display = 'block';
        } else {
          localVideo.style.display = 'none';
        }
        
        return this.isVideoEnabled;
      }
    }
    return false;
  }

  toggleAudio() {
    if (this.localStream) {
      const audioTracks = this.localStream.getAudioTracks();
      if (audioTracks.length > 0) {
        this.isAudioEnabled = !this.isAudioEnabled;
        audioTracks.forEach(track => {
          track.enabled = this.isAudioEnabled;
        });
        return this.isAudioEnabled;
      }
    }
    return false;
  }

  startHeartbeat() {
    this.heartbeatInterval = setInterval(async () => {
      if (this.currentRoom && this.currentPeerId) {
        await supabaseClient
          .from('participants')
          .update({ last_seen: new Date().toISOString() })
          .eq('peer_id', this.currentPeerId);
        
        await this.cleanupStaleParticipants();
      }
    }, 30000);
    
    this.cleanupStaleParticipants();
  }

  async cleanupStaleParticipants() {
    if (!this.currentRoom) return;
    
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const { data: staleParticipants } = await supabaseClient
        .from('participants')
        .select('peer_id')
        .eq('room_id', this.currentRoom.id)
        .lt('last_seen', fiveMinutesAgo);
      
      if (staleParticipants && staleParticipants.length > 0) {
        for (const participant of staleParticipants) {
          await supabaseClient
            .from('participants')
            .delete()
            .eq('peer_id', participant.peer_id);
          
          this.removePeerConnection(participant.peer_id);
        }
        
        await updateParticipantsList();
      }
    } catch (error) {
      console.error('Error cleaning up stale participants:', error);
    }
  }

  async leaveRoom() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.reconnectionTimeouts.forEach(timeout => clearTimeout(timeout));
    this.reconnectionTimeouts.clear();
    this.reconnectionAttempts.clear();
    this.pendingIceCandidates.clear();
    this.qualityMonitoringIntervals.forEach(interval => clearInterval(interval));
    this.qualityMonitoringIntervals.clear();

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    this.peerConnections.forEach((pc, peerId) => {
      pc.close();
    });
    this.peerConnections.clear();

    this.remoteStreams.forEach((stream) => {
      stream.getTracks().forEach(track => track.stop());
    });
    this.remoteStreams.clear();

    if (this.signalingChannel) {
      await this.signalingChannel.unsubscribe();
      this.signalingChannel = null;
    }

    if (this.roomChannel) {
      await this.roomChannel.unsubscribe();
      this.roomChannel = null;
    }

    if (this.currentPeerId) {
      await supabaseClient
        .from('participants')
        .delete()
        .eq('peer_id', this.currentPeerId);
    }

    const videoGrid = document.getElementById('videoGrid');
    const remoteVideos = videoGrid.querySelectorAll('.video-container:not(.local-video)');
    remoteVideos.forEach(container => container.remove());

    this.currentRoom = null;
    this.currentPeerId = null;
    this.username = null;
  }
}

const webrtcManager = new WebRTCManager();

document.getElementById('createRoomBtn').addEventListener('click', async () => {
  const username = document.getElementById('username').value.trim();
  const enableVideo = document.getElementById('enableVideo').checked;
  const enableAudio = document.getElementById('enableAudio').checked;

  if (!username) {
    showStatus('Please enter your name', 'error');
    return;
  }

  try {
    const roomCode = await webrtcManager.createRoom(username, enableVideo, enableAudio);
    document.getElementById('currentRoomCode').textContent = roomCode;
    switchScreen('callScreen');
    await updateParticipantsList();
  } catch (error) {
    showError(error.message);
  }
});

document.getElementById('joinRoomBtn').addEventListener('click', async () => {
  const username = document.getElementById('username').value.trim();
  const roomCode = document.getElementById('roomCode').value.trim();
  const enableVideo = document.getElementById('enableVideo').checked;
  const enableAudio = document.getElementById('enableAudio').checked;

  if (!username) {
    showStatus('Please enter your name', 'error');
    return;
  }

  if (!roomCode) {
    showStatus('Please enter a room code', 'error');
    return;
  }

  try {
    const joinedRoomCode = await webrtcManager.joinRoom(roomCode, username, enableVideo, enableAudio);
    document.getElementById('currentRoomCode').textContent = joinedRoomCode;
    switchScreen('callScreen');
    await updateParticipantsList();
  } catch (error) {
    showError(error.message);
  }
});

document.getElementById('leaveRoomBtn').addEventListener('click', async () => {
  await webrtcManager.leaveRoom();
  switchScreen('setupScreen');
  document.getElementById('roomCode').value = '';
});

document.getElementById('copyRoomBtn').addEventListener('click', () => {
  const roomCode = document.getElementById('currentRoomCode').textContent;
  navigator.clipboard.writeText(roomCode).then(() => {
    showStatus('Room code copied!', 'success');
  });
});

document.getElementById('toggleVideoBtn').addEventListener('click', (e) => {
  const isEnabled = webrtcManager.toggleVideo();
  e.currentTarget.classList.toggle('active', isEnabled);
});

document.getElementById('toggleAudioBtn').addEventListener('click', (e) => {
  const isEnabled = webrtcManager.toggleAudio();
  e.currentTarget.classList.toggle('active', isEnabled);
});

document.getElementById('retryBtn').addEventListener('click', () => {
  switchScreen('setupScreen');
});

async function updateParticipantsList() {
  if (!webrtcManager.currentRoom) return;

  const { data: participants } = await supabaseClient
    .from('participants')
    .select('*')
    .eq('room_id', webrtcManager.currentRoom.id);

  const participantsList = document.getElementById('participantsList');
  const participantCount = document.getElementById('participantCount');

  participantsList.innerHTML = '';
  participantCount.textContent = participants ? participants.length : 0;

  if (participants) {
    participants.forEach(participant => {
      const badge = document.createElement('div');
      badge.className = 'participant-badge';
      badge.textContent = participant.username;
      if (participant.peer_id === webrtcManager.currentPeerId) {
        badge.textContent += ' (You)';
      }
      participantsList.appendChild(badge);
    });
  }
}

function switchScreen(screenId) {
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
  });
  document.getElementById(screenId).classList.add('active');
}

function showStatus(message, type = 'info') {
  const indicator = document.getElementById('statusIndicator');
  indicator.textContent = message;
  indicator.className = `status-indicator ${type} show`;
  
  setTimeout(() => {
    indicator.classList.remove('show');
  }, 3000);
}

function showError(message) {
  document.getElementById('errorMessage').textContent = message;
  switchScreen('errorScreen');
}

window.addEventListener('beforeunload', (e) => {
  if (webrtcManager.currentPeerId && webrtcManager.currentRoom) {
    if (webrtcManager.localStream) {
      webrtcManager.localStream.getTracks().forEach(track => track.stop());
    }
    
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${SUPABASE_URL}/rest/v1/rpc/delete_participant`, false);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('apikey', SUPABASE_ANON_KEY);
      xhr.setRequestHeader('Authorization', `Bearer ${SUPABASE_ANON_KEY}`);
      xhr.send(JSON.stringify({ p_peer_id: webrtcManager.currentPeerId }));
    } catch (e) {
      console.error('Cleanup failed:', e);
    }
  }
});

window.addEventListener('pagehide', (e) => {
  if (webrtcManager.currentPeerId && webrtcManager.currentRoom) {
    if (webrtcManager.localStream) {
      webrtcManager.localStream.getTracks().forEach(track => track.stop());
    }
    
    webrtcManager.peerConnections.forEach((pc) => pc.close());
    
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${SUPABASE_URL}/rest/v1/rpc/delete_participant`, false);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('apikey', SUPABASE_ANON_KEY);
      xhr.setRequestHeader('Authorization', `Bearer ${SUPABASE_ANON_KEY}`);
      xhr.send(JSON.stringify({ p_peer_id: webrtcManager.currentPeerId }));
    } catch (e) {
      console.error('Cleanup failed:', e);
    }
  }
});

document.addEventListener('visibilitychange', async () => {
  if (document.hidden && webrtcManager.currentRoom && webrtcManager.currentPeerId) {
    await supabaseClient
      .from('participants')
      .update({ last_seen: new Date().toISOString() })
      .eq('peer_id', webrtcManager.currentPeerId);
  }
});

const urlParams = new URLSearchParams(window.location.search);
const isEmbedMode = urlParams.get('embed') === 'true';
const embedMode = urlParams.get('mode') || 'both';
const embedUsername = urlParams.get('username') || 'Guest';
const embedRoomCode = urlParams.get('roomCode');
const embedAutoJoin = urlParams.get('autoJoin') === 'true';
const embedParentOrigin = urlParams.get('parentOrigin');

if (isEmbedMode) {
  document.body.classList.add('embed-mode');
  
  const embedVideoEnabled = embedMode === 'video' || embedMode === 'both';
  const embedAudioEnabled = embedMode === 'audio' || embedMode === 'both';
  
  document.getElementById('enableVideo').checked = embedVideoEnabled;
  document.getElementById('enableAudio').checked = embedAudioEnabled;
  
  if (embedMode === 'audio') {
    document.getElementById('enableVideo').disabled = true;
  } else if (embedMode === 'video') {
    document.getElementById('enableAudio').disabled = true;
  }
  
  if (embedUsername) {
    document.getElementById('username').value = embedUsername;
  }
  
  if (embedRoomCode) {
    document.getElementById('roomCode').value = embedRoomCode;
  }
  
  const sendMessageToParent = (type, data) => {
    if (window.parent !== window && embedParentOrigin) {
      window.parent.postMessage({ type, data }, embedParentOrigin);
    }
  };
  
  sendMessageToParent('callconnect:ready', { mode: embedMode });
  
  window.addEventListener('message', async (event) => {
    if (!embedParentOrigin) {
      console.error('Cannot process messages: parentOrigin not provided. This is a security requirement.');
      return;
    }
    
    if (event.origin !== embedParentOrigin) {
      console.warn('Ignoring message from untrusted origin:', event.origin);
      return;
    }
    
    const { type, data } = event.data;
    
    if (type === 'callconnect:join' && data.roomCode) {
      document.getElementById('username').value = data.username || embedUsername;
      document.getElementById('roomCode').value = data.roomCode;
      document.getElementById('joinRoomBtn').click();
    } else if (type === 'callconnect:create') {
      document.getElementById('username').value = data.username || embedUsername;
      document.getElementById('createRoomBtn').click();
    } else if (type === 'callconnect:leave') {
      document.getElementById('leaveRoomBtn').click();
    } else if (type === 'callconnect:toggleVideo') {
      if (webrtcManager.isVideoEnabled !== data.enabled) {
        document.getElementById('toggleVideoBtn').click();
      }
    } else if (type === 'callconnect:toggleAudio') {
      if (webrtcManager.isAudioEnabled !== data.enabled) {
        document.getElementById('toggleAudioBtn').click();
      }
    }
  });
  
  const originalCreateRoom = webrtcManager.createRoom.bind(webrtcManager);
  webrtcManager.createRoom = async function(...args) {
    const result = await originalCreateRoom(...args);
    sendMessageToParent('callconnect:joined', { roomCode: result, action: 'created' });
    return result;
  };
  
  const originalJoinRoom = webrtcManager.joinRoom.bind(webrtcManager);
  webrtcManager.joinRoom = async function(...args) {
    const result = await originalJoinRoom(...args);
    sendMessageToParent('callconnect:joined', { roomCode: result, action: 'joined' });
    return result;
  };
  
  const originalLeaveRoom = webrtcManager.leaveRoom.bind(webrtcManager);
  webrtcManager.leaveRoom = async function(...args) {
    const result = await originalLeaveRoom(...args);
    sendMessageToParent('callconnect:left', {});
    return result;
  };
  
  if (embedAutoJoin && embedRoomCode) {
    setTimeout(() => {
      document.getElementById('joinRoomBtn').click();
    }, 500);
  }
}
