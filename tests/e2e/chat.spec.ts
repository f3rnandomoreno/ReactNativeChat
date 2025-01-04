import { test, expect } from "@playwright/test";

test("chat basic functionality", async ({ page }) => {
  // Navegar a la página
  await page.goto("http://localhost:5000");
  console.log("✅ Página cargada");

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
  const message = "Hello, this is a test message!";
  let currentText = "";

  for (const char of message) {
    await messageInput.type(char, { delay: 100 });
    currentText += char;

    // Verificar que el texto actual está visible en el input
    const inputValue = await messageInput.inputValue();
    console.log(
      `Escribiendo: "${currentText}" - Valor actual: "${inputValue}"`
    );
    expect(inputValue).toBe(currentText);

    // Verificar que el texto se muestra en el área de mensaje
    await expect(page.locator(`text="${currentText}"`)).toBeVisible({
      timeout: 1000,
    });

    // Verificar que el nombre del usuario aparece como escritor mientras escribe
    await expect(
      page.locator('text="Test User está escribiendo..."')
    ).toBeVisible({
      timeout: 2000,
    });
  }
  console.log("✅ Mensaje escrito completamente");

  // Presionar Enter para enviar
  await page.keyboard.press("Enter");
  console.log("✅ Mensaje enviado");

  // Verificar que el mensaje completo aparece en el chat
  await expect(page.locator(`text="${message}"`)).toBeVisible({
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
