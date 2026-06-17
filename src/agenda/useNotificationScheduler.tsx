const verificar = () => {
  const agora = Date.now();

  console.log("================================");
  console.log("Agora:", new Date(agora));

  for (const evento of eventosRef.current) {
    if (!evento.lembrete || evento.lembrete === "Sem lembrete") continue;

    const offset = OFFSET_MS[evento.lembrete];
    if (offset === undefined) continue;

    const dataHora = new Date(`${evento.data}T${evento.horaInicio}:00`);

    if (isNaN(dataHora.getTime())) {
      console.log("Data inválida:", evento);
      continue;
    }

    const momentoNotificar = dataHora.getTime() - offset;
    const chave = `${evento.id}-${evento.lembrete}`;
    const dentro = Math.abs(agora - momentoNotificar) <= 60_000;

    console.log({
      evento: evento.nome,
      data: evento.data,
      horaInicio: evento.horaInicio,
      lembrete: evento.lembrete,
      dataHoraEvento: dataHora,
      momentoNotificar: new Date(momentoNotificar),
      diferencaSegundos: Math.floor(
        (agora - momentoNotificar) / 1000
      ),
      dentroJanela: dentro,
      jaNotificado: notificados.has(chave),
    });

    if (dentro && !notificados.has(chave)) {
      notificados.add(chave);

      const label = `em ${evento.lembrete}`;

      console.log("🔔 NOTIFICAÇÃO DISPARADA:", evento.nome);

      toastRef.current({
        kind: "warning",
        text: `🔔 ${evento.nome} — começa ${label}`,
      });

      if (
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        new Notification("Agenda Digital", {
          body: `⏰ ${evento.nome} começa ${label}`,
          icon: "/favicon.ico",
        });
      }
    }
  }
};
