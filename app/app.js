document.addEventListener('DOMContentLoaded', () => {
  const isEn = document.documentElement.lang.startsWith('en');

  // Inicializa o estado persistente com base em timestamps reais
  const now = Date.now();
  const defaultInitialUptime = 17 * 3600 + 42 * 60; // 17h 42m em segundos

  if (!localStorage.getItem('k8s_pod1_start')) {
    localStorage.setItem('k8s_pod1_start', (now - defaultInitialUptime * 1000).toString());
    localStorage.setItem('k8s_pod1_total', '14');
    localStorage.setItem('k8s_pod1_session', '0');
    localStorage.setItem('k8s_pod1_hash', '7d9f8');
  }

  if (!localStorage.getItem('k8s_pod2_start')) {
    localStorage.setItem('k8s_pod2_start', (now - defaultInitialUptime * 1000).toString());
    localStorage.setItem('k8s_pod2_total', '9');
    localStorage.setItem('k8s_pod2_session', '0');
    localStorage.setItem('k8s_pod2_hash', '3c2e1');
  }

  let podStatus = {
    1: {
      healthy: true,
      startTime: parseInt(localStorage.getItem('k8s_pod1_start')),
      totalRestarts: parseInt(localStorage.getItem('k8s_pod1_total')),
      sessionRestarts: parseInt(localStorage.getItem('k8s_pod1_session')),
      hash: localStorage.getItem('k8s_pod1_hash')
    },
    2: {
      healthy: true,
      startTime: parseInt(localStorage.getItem('k8s_pod2_start')),
      totalRestarts: parseInt(localStorage.getItem('k8s_pod2_total')),
      sessionRestarts: parseInt(localStorage.getItem('k8s_pod2_session')),
      hash: localStorage.getItem('k8s_pod2_hash')
    }
  };

  let nextTarget = 1;

  const btnTraffic = document.getElementById('btn-traffic');
  const btnBurst = document.getElementById('btn-burst');
  const btnHeaders = document.getElementById('btn-headers');
  const btnReset = document.getElementById('btn-reset');
  const btnKill1 = document.getElementById('btn-kill-1');
  const btnKill2 = document.getElementById('btn-kill-2');

  function formatUptime(seconds) {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }

  function updateView() {
    [1, 2].forEach(id => {
      const p = podStatus[id];
      if (p.healthy) {
        const elapsedSec = Math.floor((Date.now() - p.startTime) / 1000);
        const elUptime = document.getElementById(`pod-uptime-${id}`);
        if (elUptime) elUptime.textContent = formatUptime(elapsedSec);
      }
      const elTotal = document.getElementById(`pod-total-restarts-${id}`);
      const elSession = document.getElementById(`pod-session-restarts-${id}`);
      const elName = document.getElementById(`pod-name-${id}`);
      if (elTotal) elTotal.textContent = p.totalRestarts;
      if (elSession) elSession.textContent = p.sessionRestarts;
      if (elName) elName.textContent = `hugoreis-app-${p.hash}-node${id}`;
    });
  }

  updateView();
  setInterval(updateView, 1000);

  function logEvent(msg, type = '') {
    const consoleBox = document.getElementById('console-log');
    if (!consoleBox) return;
    const time = new Date().toTimeString().split(' ')[0];
    const div = document.createElement('div');
    div.className = 'console-line ' + type;
    div.textContent = `[${time}] ${msg}`;
    consoleBox.appendChild(div);
    consoleBox.scrollTop = consoleBox.scrollHeight;
  }

  function simulateTraffic(showLog = true) {
    const activePods = [1, 2].filter(id => podStatus[id].healthy);
    if (activePods.length === 0) {
      if (showLog) logEvent(isEn ? "503 Service Unavailable: All pods are down!" : "ERRO 503 Service Unavailable: Todas as réplicas estão inativas!", "err");
      return;
    }

    let targetPod = nextTarget;
    if (!podStatus[targetPod].healthy) {
      targetPod = activePods[0];
    }
    nextTarget = targetPod === 1 ? 2 : 1;

    const podCard = document.getElementById(`pod-card-${targetPod}`);
    if (podCard) {
      podCard.classList.add('highlight');
      setTimeout(() => podCard.classList.remove('highlight'), 300);
    }

    const latency = Math.floor(Math.random() * 10) + 12;
    if (showLog) {
      const msg = isEn 
        ? `HTTP/2 GET 200 OK -> Routed via LB to Pod ${targetPod} (${latency}ms)`
        : `HTTP/2 GET 200 OK -> Roteado via LB para Pod ${targetPod} (${latency}ms)`;
      logEvent(msg, "success");
    }
  }

  function triggerBurst() {
    logEvent(isEn ? "⚡ Load Balancer: Dispatching burst of 10 requests..." : "⚡ Balanceador: Disparando rajada de 10 requisições...", "warn");
    let count = 0;
    const interval = setInterval(() => {
      simulateTraffic(false);
      count++;
      if (count >= 10) {
        clearInterval(interval);
        logEvent(isEn ? "✅ 10/10 requests routed successfully across active pods." : "✅ 10/10 requisições distribuídas com sucesso entre os pods ativos.", "success");
      }
    }, 180);
  }

  function inspectHeaders() {
    logEvent("--- HTTP RESPONSE SECURITY HEADERS ---", "warn");
    logEvent("status: 200 OK (HTTP/2.0)");
    logEvent("server: cloudflare");
    logEvent("strict-transport-security: max-age=15768000; includeSubDomains; preload");
    logEvent("content-security-policy: default-src 'none'; style-src 'self'; script-src 'self'");
    logEvent("x-content-type-options: nosniff");
    logEvent("x-frame-options: DENY");
    logEvent(isEn ? "🛡️ Verified: Origin IP masked & Mozilla Observatory A+ compliant." : "🛡️ Verificado: IP de origem mascarado & A+ Mozilla Observatory ativo.", "success");
  }

  function resetSession() {
    [1, 2].forEach(id => {
      podStatus[id].sessionRestarts = 0;
      localStorage.setItem(`k8s_pod${id}_session`, '0');
    });
    updateView();
    logEvent(isEn ? "🔄 Session metrics reset. Chaos counters set to 0." : "🔄 Métricas da sessão zeradas. Contadores locais reiniciados.", "warn");
  }

  function killPod(id) {
    if (!podStatus[id].healthy) return;
    podStatus[id].healthy = false;
    podStatus[id].totalRestarts++;
    podStatus[id].sessionRestarts++;

    localStorage.setItem(`k8s_pod${id}_total`, podStatus[id].totalRestarts.toString());
    localStorage.setItem(`k8s_pod${id}_session`, podStatus[id].sessionRestarts.toString());

    const card = document.getElementById(`pod-card-${id}`);
    const badge = document.getElementById(`pod-status-${id}`);
    const ready = document.getElementById(`pod-ready-${id}`);
    const load = document.getElementById(`pod-load-${id}`);

    if (card) card.classList.add('failing');
    if (badge) {
      badge.className = 'pod-badge badge-failed';
      badge.textContent = 'Terminating';
    }
    if (ready) ready.textContent = '0/1';
    if (load) load.textContent = isEn ? 'Traffic Load: 0% (Drained)' : 'Carga: 0% (Drenado)';

    const survivorId = id === 1 ? 2 : 1;
    const survivorLoad = document.getElementById(`pod-load-${survivorId}`);
    if (survivorLoad) {
      survivorLoad.textContent = isEn ? 'Traffic Load: 100% (Failover Active)' : 'Carga: 100% (Failover Ativo)';
    }

    logEvent(isEn 
      ? `⚠️ ALERT: SIGTERM sent to Pod ${id}. Fault injected!`
      : `⚠️ ALERTA: Sinal SIGTERM enviado ao Pod ${id}. Falha injetada!`, "err");
    
    logEvent(isEn
      ? `[lb] Traffic successfully rerouted 100% to Pod ${survivorId}.`
      : `[lb] Tráfego desviado integralmente para o Pod ${survivorId}.`, "warn");

    setTimeout(() => {
      if (badge) {
        badge.className = 'pod-badge badge-recovering';
        badge.textContent = 'ContainerCreating';
      }
      logEvent(isEn
        ? `[k8s] ReplicaSet detected 1/2 replicas. Recreating Pod ${id}...`
        : `[k8s] ReplicaSet detectou 1/2 réplicas. Recriando Pod ${id}...`, "warn");
    }, 1800);

    setTimeout(() => {
      const newHash = Math.random().toString(36).substring(2, 7);
      podStatus[id].healthy = true;
      podStatus[id].startTime = Date.now();
      podStatus[id].hash = newHash;

      localStorage.setItem(`k8s_pod${id}_start`, podStatus[id].startTime.toString());
      localStorage.setItem(`k8s_pod${id}_hash`, newHash);

      if (card) card.classList.remove('failing');
      if (badge) {
        badge.className = 'pod-badge badge-running';
        badge.textContent = 'Running';
      }
      if (ready) ready.textContent = '1/1';
      if (load) load.textContent = isEn ? 'Traffic Load: 50% (Normal)' : 'Carga: 50% (Normal)';
      if (survivorLoad) survivorLoad.textContent = isEn ? 'Traffic Load: 50% (Normal)' : 'Carga: 50% (Normal)';

      updateView();
      logEvent(isEn
        ? `✅ SUCCESS: New replica ready (hugoreis-app-${newHash}-node${id}). Probes passed!`
        : `✅ SUCESSO: Nova réplica ativa (hugoreis-app-${newHash}-node${id}). Probes validados!`, "success");
    }, 4200);
  }

  if (btnTraffic) btnTraffic.addEventListener('click', () => simulateTraffic(true));
  if (btnBurst) btnBurst.addEventListener('click', triggerBurst);
  if (btnHeaders) btnHeaders.addEventListener('click', inspectHeaders);
  if (btnReset) btnReset.addEventListener('click', resetSession);
  if (btnKill1) btnKill1.addEventListener('click', () => killPod(1));
  if (btnKill2) btnKill2.addEventListener('click', () => killPod(2));
});
