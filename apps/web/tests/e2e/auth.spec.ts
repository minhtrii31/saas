import { expect, test } from "@playwright/test";

test("register page renders form", async ({ page }) => {
  await page.goto("/register");

  await expect(
    page.getByRole("heading", { name: "Create your account" }),
  ).toBeVisible();
  await expect(page.getByRole("form", { name: "Register form" })).toBeVisible();
  await expect(page.getByLabel("Name")).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: "Register" })).toBeVisible();
});

test("register page shows success after successful submit", async ({ page }) => {
  await page.route("**/auth/register", async (route) => {
    const request = route.request();
    expect(request.method()).toBe("POST");
    expect(request.postDataJSON()).toEqual({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "password123",
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          user: {
            id: "user_1",
            email: "ada@example.com",
            name: "Ada Lovelace",
          },
          tokens: {
            accessToken: "test-token",
          },
        },
        meta: {},
      }),
    });
  });

  await page.goto("/register");
  await page.getByLabel("Name").fill("Ada Lovelace");
  await page.getByLabel("Email").fill("ada@example.com");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Register" }).click();

  await expect(
    page.getByRole("button", { name: "Creating account..." }),
  ).toBeDisabled();
  await expect(
    page.getByText(
      "Account created successfully. You can log in when login is available.",
    ),
  ).toBeVisible();
});

test("register page shows API error after failed submit", async ({ page }) => {
  await page.route("**/auth/register", async (route) => {
    await route.fulfill({
      status: 409,
      contentType: "application/json",
      body: JSON.stringify({
        error: {
          code: "EMAIL_ALREADY_EXISTS",
          message: "An account with this email already exists.",
        },
        meta: {},
      }),
    });
  });

  await page.goto("/register");
  await page.getByLabel("Name").fill("Ada Lovelace");
  await page.getByLabel("Email").fill("ada@example.com");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Register" }).click();

  await expect(
    page.getByRole("alert").filter({
      hasText: "An account with this email already exists.",
    }),
  ).toBeVisible();
});

test("login page renders form", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
  await expect(page.getByRole("form", { name: "Login form" })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: "Log in" })).toBeVisible();
});

test("dashboard page renders placeholder", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(
    page.getByRole("heading", { name: "Dashboard", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Dashboard placeholder" }),
  ).toBeVisible();
});
