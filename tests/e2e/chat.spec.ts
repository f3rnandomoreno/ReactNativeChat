import { test, expect } from "@playwright/test";

test("chat basic functionality", async ({ page }) => {
  // Navegar a la página
  await page.goto("http://localhost:5000");

  // Introducir el nombre
  await page.fill('input[placeholder="Tu nombre"]', "Test User");
  await page.click('button:has-text("Continuar")');

  // Esperar a que aparezca el selector de color
  await page.waitForSelector('h2:has-text("Choose Your Color")');

  // Seleccionar el color rojo (primer color)
  const colorButtons = await page.locator("button.rounded-full").all();
  await colorButtons[0].click();

  // Esperar a que el botón "Join Chat" esté habilitado y hacer clic
  await page.waitForSelector('button:has-text("Join Chat"):not([disabled])');
  await page.click('button:has-text("Join Chat")');

  // Esperar a que se cargue el chat (esperando el contenedor de mensaje)
  await page.waitForSelector('div:has-text("Empieza a escribir...")', {
    timeout: 5000,
  });

  // Escribir un mensaje
  await page.locator("textarea").click();
  await page.keyboard.type("Hello, this is a test message!");
  await page.keyboard.press("Enter");

  // Verificar que el mensaje aparece en el chat
  await expect(
    page.locator('text="Hello, this is a test message!"')
  ).toBeVisible();

  // Verificar que el nombre del usuario aparece como escritor
  await expect(
    page.locator('text="Test User está escribiendo..."')
  ).toBeVisible();
});
