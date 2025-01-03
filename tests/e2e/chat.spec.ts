import { test, expect } from "@playwright/test";

test("chat basic functionality", async ({ page }) => {
  // Navegar a la página
  await page.goto("http://localhost:5000");

  // Introducir el nombre
  await page.fill('input[placeholder="Tu nombre"]', "Test User");
  await page.click('button:has-text("Continuar")');

  // Seleccionar un color
  const redColor = await page.locator(
    'button[style*="background-color: #ef4444"]'
  );
  await redColor.click();

  // Unirse al chat
  await page.click('button:has-text("Join Chat")');

  // Esperar a que se cargue el chat
  await page.waitForSelector(".messages-container", { timeout: 5000 });

  // Escribir y enviar un mensaje
  await page.fill(
    'input[placeholder="Escribe un mensaje..."]',
    "Hello, this is a test message!"
  );
  await page.click('button[type="submit"]');

  // Verificar que el mensaje aparece en el chat
  const message = await page
    .locator('text="Hello, this is a test message!"')
    .first();
  await expect(message).toBeVisible();

  // Verificar que el nombre del usuario aparece
  const username = await page.locator('text="Test User"').first();
  await expect(username).toBeVisible();
});
