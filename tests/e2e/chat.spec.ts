import { test, expect } from "@playwright/test";

test("chat basic functionality", async ({ page }) => {
  // Navegar a la página
  await page.goto("http://localhost:5000");
  console.log("✅ Página cargada");

  // Esperar a que el socket se conecte
  await page.waitForFunction(
    () => {
      // @ts-ignore
      return window.socketConnected === true;
    },
    { timeout: 5000 }
  );
  console.log("✅ Socket conectado");

  // Introducir el nombre
  await page.fill('input[placeholder="Tu nombre"]', "Test User");
  await page.click('button:has-text("Continuar")');
  console.log("✅ Nombre introducido");

  // Esperar a que aparezca el selector de color
  await page.waitForSelector('h2:has-text("Choose Your Color")');
  console.log("✅ Selector de color visible");

  // Seleccionar el color rojo (primer color)
  const colorButtons = await page.locator("button.rounded-full").all();
  console.log(`Found ${colorButtons.length} color buttons`);
  await colorButtons[0].click();
  console.log("✅ Color seleccionado");

  // Esperar a que el botón "Join Chat" esté habilitado y hacer clic
  await page.waitForSelector('button:has-text("Join Chat"):not([disabled])');
  await page.click('button:has-text("Join Chat")');
  console.log("✅ Botón Join Chat clickeado");

  // Esperar a que se cargue el chat
  await page.waitForSelector('div:has-text("Empieza a escribir...")', {
    timeout: 10000,
    state: "visible",
  });
  console.log("✅ Chat cargado");

  // Esperar y localizar el input de mensaje
  const messageInput = await page.waitForSelector(
    'input[placeholder="Escribe tu mensaje..."]',
    {
      timeout: 10000,
      state: "visible",
    }
  );
  console.log("✅ Input de mensaje encontrado");

  // Escribir el mensaje letra por letra y verificar cada paso
  const message = "Hola!";
  let currentText = "";

  for (const char of message) {
    await messageInput.type(char, { delay: 50 });
    currentText += char;

    // Verificar que el texto actual está visible en el input
    const inputValue = await messageInput.inputValue();
    console.log(
      `Escribiendo: "${currentText}" - Valor actual: "${inputValue}"`
    );
    expect(inputValue).toBe(currentText);

    // Verificar que el texto se muestra en el área de mensaje
    await expect(page.locator(`text="${currentText}"`)).toBeVisible({
      timeout: 5000,
    });

    // Verificar que el nombre del usuario aparece como escritor mientras escribe
    await expect(
      page.locator('text="Test User está escribiendo..."')
    ).toBeVisible({
      timeout: 5000,
    });
  }
  console.log("✅ Mensaje escrito completamente");

  // Presionar Enter para enviar
  await page.keyboard.press("Enter");
  console.log("✅ Mensaje enviado");

  // Verificar que el mensaje completo aparece en el chat
  await expect(page.locator(`div.text-xl >> text="${message}"`)).toBeVisible({
    timeout: 5000,
  });
  console.log("✅ Mensaje visible en el chat");

  // Verificar que el mensaje "está escribiendo..." ya no está visible
  await expect(
    page.locator('text="Test User está escribiendo..."')
  ).not.toBeVisible({
    timeout: 2000,
  });
  console.log("✅ Mensaje de escritura ya no visible");
});

test("writing blocking between users", async ({ browser }) => {
  // Crear dos páginas/contextos diferentes
  console.log("🔵 Creando contextos de navegador");
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();
  const page1 = await context1.newPage();
  const page2 = await context2.newPage();

  // Función helper para unirse al chat
  async function joinChat(page: any, userName: string, url?: string) {
    console.log(`🔵 ${userName}: Iniciando proceso de unión al chat`);
    await page.goto(url || "http://localhost:5000");
    console.log(`🔵 ${userName}: Página cargada`);

    // Esperar a que el socket se conecte
    await page.waitForFunction(
      () => {
        // @ts-ignore
        return window.socketConnected === true;
      },
      { timeout: 5000 }
    );
    console.log(`🔵 ${userName}: Socket conectado`);

    await page.fill('input[placeholder="Tu nombre"]', userName);
    await page.click('button:has-text("Continuar")');
    console.log(`🔵 ${userName}: Nombre introducido`);

    await page.waitForSelector('h2:has-text("Choose Your Color")');
    const colorButtons = await page.locator("button.rounded-full").all();
    await colorButtons[0].click();
    console.log(`🔵 ${userName}: Color seleccionado`);

    await page.click('button:has-text("Join Chat")');
    console.log(`🔵 ${userName}: Botón Join Chat clickeado`);

    await page.waitForSelector('div:has-text("Empieza a escribir...")', {
      timeout: 10000,
    });
    console.log(`🔵 ${userName}: Chat cargado`);
  }

  // Unir Usuario 1 al chat y obtener la URL de la sala
  console.log("🔵 Uniendo Usuario 1 al chat");
  await joinChat(page1, "Usuario 1");
  console.log("🔵 Obteniendo URL de la sala");
  const roomUrl = await page1.locator("input.bg-gray-50").inputValue();
  console.log(`🔵 URL de la sala: ${roomUrl}`);

  // Unir Usuario 2 a la misma sala
  console.log("🔵 Uniendo Usuario 2 a la misma sala");
  await joinChat(page2, "Usuario 2", roomUrl);
  console.log("✅ Ambos usuarios unidos al chat");

  // Esperar un momento para asegurar que todo está listo
  console.log("🔵 Esperando 1 segundo para asegurar sincronización");
  await page1.waitForTimeout(1000);

  // Verificar estado inicial
  console.log("🔵 Verificando estado inicial de los inputs");
  const messageInput1 = await page1.locator(
    'input[placeholder="Escribe tu mensaje..."]'
  );
  const messageInput2 = await page2.locator(
    'input[placeholder="Escribe tu mensaje..."]'
  );

  await expect(messageInput1).toBeEnabled();
  await expect(messageInput2).toBeEnabled();
  console.log("✅ Ambos inputs inicialmente habilitados");

  // Usuario 1 empieza a escribir
  console.log("🔵 Usuario 1: Empezando a escribir");
  await messageInput1.focus();
  await messageInput1.type("Hola", { delay: 100 });
  console.log("✅ Usuario 1 está escribiendo");

  // Esperar un momento para que se propague el estado
  await page1.waitForTimeout(1000);

  // Verificar que el Usuario 2 está bloqueado mientras Usuario 1 escribe
  // Usamos evaluateHandle para verificar el estado sin cambiar el foco
  console.log(
    "🔵 Verificando que Usuario 2 está bloqueado mientras Usuario 1 escribe"
  );
  const isDisabled = await page2.evaluate(() => {
    const input = document.querySelector(
      '[data-testid="message-input"]'
    ) as HTMLInputElement;
    return input?.disabled || false;
  });
  expect(isDisabled).toBe(true);
  console.log("✅ Input del Usuario 2 bloqueado durante escritura");

  // Verificar mensaje de escritura
  console.log("🔵 Verificando mensaje de escritura");
  const writerMessage = await page2.locator(
    'text="Usuario 1 está escribiendo..."'
  );
  await expect(writerMessage).toBeVisible({ timeout: 5000 });
  console.log("✅ Mensaje de escritura visible para Usuario 2");

  // Usuario 1 presiona Enter para enviar el mensaje
  console.log("🔵 Usuario 1: Enviando mensaje");
  await page1.keyboard.press("Enter");
  console.log("✅ Usuario 1 envió el mensaje");

  // Esperar a que se propague el estado
  console.log("🔵 Esperando propagación del estado (1s)");
  await page1.waitForTimeout(1000);

  // Verificar que Usuario 2 está desbloqueado después del Enter
  console.log(
    "🔵 Verificando que Usuario 2 está desbloqueado después del Enter"
  );
  await expect(messageInput2).toBeEnabled();
  console.log("✅ Input del Usuario 2 desbloqueado después del Enter");

  // Cerrar los contextos
  console.log("🔵 Cerrando contextos del navegador");
  await context1.close();
  await context2.close();
});

test("bidirectional writing visibility", async ({ browser }) => {
  // Crear dos páginas/contextos diferentes
  console.log("🔵 Creando contextos de navegador");
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();
  const page1 = await context1.newPage();
  const page2 = await context2.newPage();

  // Función helper para unirse al chat (reutilizada del test anterior)
  async function joinChat(page: any, userName: string, url?: string) {
    console.log(`🔵 ${userName}: Iniciando proceso de unión al chat`);
    await page.goto(url || "http://localhost:5000");
    console.log(`🔵 ${userName}: Página cargada`);

    await page.waitForFunction(
      () => {
        // @ts-ignore
        return window.socketConnected === true;
      },
      { timeout: 5000 }
    );
    console.log(`🔵 ${userName}: Socket conectado`);

    await page.fill('input[placeholder="Tu nombre"]', userName);
    await page.click('button:has-text("Continuar")');
    console.log(`🔵 ${userName}: Nombre introducido`);

    await page.waitForSelector('h2:has-text("Choose Your Color")');
    const colorButtons = await page.locator("button.rounded-full").all();
    await colorButtons[0].click();
    console.log(`🔵 ${userName}: Color seleccionado`);

    await page.click('button:has-text("Join Chat")');
    console.log(`🔵 ${userName}: Botón Join Chat clickeado`);

    await page.waitForSelector('div:has-text("Empieza a escribir...")', {
      timeout: 10000,
    });
    console.log(`🔵 ${userName}: Chat cargado`);
  }

  // Unir Usuario 1 (creador de la sala)
  console.log("🔵 Uniendo Usuario 1 (creador)");
  await joinChat(page1, "Usuario 1");
  const roomUrl = await page1.locator("input.bg-gray-50").inputValue();

  // Unir Usuario 2
  console.log("🔵 Uniendo Usuario 2");
  await joinChat(page2, "Usuario 2", roomUrl);
  console.log("✅ Ambos usuarios unidos al chat");

  // Obtener referencias a los inputs
  const input1 = await page1.locator(
    'input[placeholder="Escribe tu mensaje..."]'
  );
  const input2 = await page2.locator(
    'input[placeholder="Escribe tu mensaje..."]'
  );

  // Test Usuario 1 escribiendo -> Usuario 2 viendo
  console.log("🔵 Probando: Usuario 1 escribe -> Usuario 2 ve");
  await input1.type("Mensaje del Usuario 1", { delay: 100 });

  // Verificar que Usuario 2 ve el mensaje
  await expect(page2.locator(`text="Mensaje del Usuario 1"`)).toBeVisible({
    timeout: 5000,
  });
  console.log("✅ Usuario 2 ve el mensaje del Usuario 1");

  // Usuario 1 libera el turno
  await page1.keyboard.press("Enter");
  await page1.waitForTimeout(1000);

  // Test Usuario 2 escribiendo -> Usuario 1 viendo
  console.log("🔵 Probando: Usuario 2 escribe -> Usuario 1 ve");
  await input2.type("Mensaje del Usuario 2", { delay: 100 });

  // Verificar que Usuario 1 ve el mensaje
  await expect(page1.locator(`text="Mensaje del Usuario 2"`)).toBeVisible({
    timeout: 5000,
  });
  console.log("✅ Usuario 1 ve el mensaje del Usuario 2");

  // Cerrar los contextos
  await context1.close();
  await context2.close();
});
