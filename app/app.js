document.addEventListener('DOMContentLoaded', () => {
  const isEn = document.documentElement.lang.startsWith('en');

  let podStatus = {
    1: { state: 'Running', restarts: 0, healthy: true },
    2: { state: 'Running', restarts: 0, healthy: true }
  };
  let nextTarget = 1;

  const btnTraffic = document.getElementById('btn-traffic');
  const btnKill1 = document.getElementById('btn-kill-1');
  const btnKill2 = document.getElementById('btn-kill-2');

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

  function simulateTraffic() {
    const activePods = [1, 2].filter(id => podStatus[id].healthy);
    if (activePods.length === 0) {
      logEvent(isEn ? "503 Service Unavailable: All backend pods are down!" : "ERRO 503 Service Unavailable: Todas as réplicas estão inativas!", "err");
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
      setTimeout(() => podCard.classList.remove('highlight'), 350);
    }

    const latency = Math.floor(Math.random() * 12) + 14;
    const msg = isEn 
      ? `HTTP/2 GET 200 OK -> Routed via LB to Pod ${targetPod} (${latency}ms)`
      : `HTTP/2 GET 200 OK -> Roteado via LB para Pod ${targetPod} (${latency}ms)`;
    logEvent(msg, "success");
  }

  function killPod(id) {
    if (!podStatus[id].healthy) return;
    podStatus[id].healthy = false;
    podStatus[id].restarts++;

    const card = document.getElementById(`pod-card-${id}`);
    const badge = document.getElementById(`pod-status-${id}`);
    const ready = document.getElementById(`pod-ready-${id}`);
    const restarts = document.getElementById(`pod-restarts-${id}`);
    const load = document.getElementById(`pod-load-${id}`);

    if (card) card.classList.add('failing');
    if (badge) {
      badge.className = 'pod-badge badge-failed';
      badge.textContent = 'Terminating';
    }
    if (ready) ready.textContent = '0/1';
    if (restarts) restarts.textContent = podStatus[id].restarts;
    if (load) load.textContent = isEn ? 'Traffic Load: 0% (Drained)' : 'Carga de Tráfego: 0% (Drenado)';

    const survivorId = id === 1 ? 2 : 1;
    const survivorLoad = document.getElementById(`pod-load-${survivorId}`);
    if (survivorLoad) {
      survivorLoad.textContent = isEn ? 'Traffic Load: 100% (Failover Active)' : 'Carga de Tráfego: 100% (Failover Ativo)';
    }

    logEvent(isEn 
      ? `⚠️ ALERT: SIGTERM signal sent to Pod ${id}. Fault injected!`
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
        ? `[k8s] OKE controller detected unhealthy pod. Recreating replica ${id}...`
        : `[k8s] Controlador OKE detetou réplica não íntegra. Recriando pod ${id}...`, "warn");
    }, 1800);

    setTimeout(() => {
      podStatus[id].healthy = true;
      if (card) card.classList.remove('failing');
      if (badge) {
        badge.className = 'pod-badge badge-running';
        badge.textContent = 'Running';
      }
      if (ready) ready.textContent = '1/1';
      if (load) load.textContent = isEn ? 'Traffic Load: 50% (Normal)' : 'Carga de Tráfego: 50% (Normal)';
      if (survivorLoad) survivorLoad.textContent = isEn ? 'Traffic Load: 50% (Normal)' : 'Carga de Tráfego: 50% (Normal)';
      
      logEvent(isEn
        ? `✅ SUCCESS: Pod ${id} restored and healthy. Liveness/Readiness probes passed!`
        : `✅ SUCESSO: Pod ${id} restabelecido e saudável. Probes de Liveness/Readiness validados!`, "success");
    }, 4200);
  }

  // Registra eventos sem usar nenhum onclick inline no HTML
  if (btnTraffic) btnTraffic.addEventListener('click', simulateTraffic);
  if (btnKill1) btnKill1.addEventListener('click', () => killPod(1));
  if (btnKill2) btnKill2.addEventListener('click', () => killPod(2));
});
