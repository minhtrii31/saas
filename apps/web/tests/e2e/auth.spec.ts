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

test("login redirects to dashboard after successful submit", async ({ page }) => {
  await page.route("**/auth/login", async (route) => {
    const request = route.request();
    expect(request.method()).toBe("POST");
    expect(request.postDataJSON()).toEqual({
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
          accessToken: "test-access-token",
        },
        meta: {},
      }),
    });
  });
  await page.route("**/auth/me", async (route) => {
    const request = route.request();
    expect(request.method()).toBe("GET");
    expect(request.headers().authorization).toBe("Bearer test-access-token");

    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          user: {
            id: "user_1",
            email: "ada@example.com",
            name: "Ada Lovelace",
          },
        },
        meta: {},
      }),
    });
  });

  await page.goto("/login");
  await page.getByLabel("Email").fill("ada@example.com");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Log in" }).click();

  await expect(
    page.getByRole("button", { name: "Logging in..." }),
  ).toBeDisabled();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(
    page.getByRole("heading", { name: "Dashboard", exact: true }),
  ).toBeVisible();
  await expect(
    page.evaluate(() => localStorage.getItem("accessToken")),
  ).resolves.toBe("test-access-token");
});

test("login page shows API error after failed submit", async ({ page }) => {
  await page.route("**/auth/login", async (route) => {
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password.",
        },
        meta: {},
      }),
    });
  });

  await page.goto("/login");
  await page.getByLabel("Email").fill("ada@example.com");
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Log in" }).click();

  await expect(
    page.getByRole("alert").filter({
      hasText: "Invalid email or password.",
    }),
  ).toBeVisible();
});

test("dashboard redirects to login when token is missing", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/login$/);
});

test("dashboard shows user info when token is valid", async ({ page }) => {
  await page.route("**/auth/me", async (route) => {
    const request = route.request();
    expect(request.method()).toBe("GET");
    expect(request.headers().authorization).toBe("Bearer valid-token");

    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          user: {
            id: "user_1",
            email: "ada@example.com",
            name: "Ada Lovelace",
          },
        },
        meta: {},
      }),
    });
  });

  await page.addInitScript(() => {
    localStorage.setItem("accessToken", "valid-token");
  });

  await page.goto("/dashboard");

  await expect(
    page.getByRole("heading", { name: "Dashboard", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Ada Lovelace"),
  ).toBeVisible();
  await expect(page.getByText("ada@example.com")).toBeVisible();
});

test("dashboard clears invalid token and redirects to login", async ({ page }) => {
  await page.route("**/auth/me", async (route) => {
    const request = route.request();
    expect(request.method()).toBe("GET");
    expect(request.headers().authorization).toBe("Bearer invalid-token");

    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid access token.",
        },
        meta: {},
      }),
    });
  });

  await page.addInitScript(() => {
    localStorage.setItem("accessToken", "invalid-token");
  });

  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.evaluate(() => localStorage.getItem("accessToken")),
  ).resolves.toBeNull();
});

test("dashboard logout clears token and redirects to login", async ({ page }) => {
  await page.route("**/auth/me", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          user: {
            id: "user_1",
            email: "ada@example.com",
            name: "Ada Lovelace",
          },
        },
        meta: {},
      }),
    });
  });

  await page.addInitScript(() => {
    localStorage.setItem("accessToken", "valid-token");
  });

  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Log out" }).click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.evaluate(() => localStorage.getItem("accessToken")),
  ).resolves.toBeNull();
});

test("dashboard clears token and redirects when user check fails", async ({
  page,
}) => {
  await page.route("**/auth/me", async (route) => {
    await route.abort();
  });

  await page.addInitScript(() => {
    localStorage.setItem("accessToken", "network-error-token");
  });

  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.evaluate(() => localStorage.getItem("accessToken")),
  ).resolves.toBeNull();
});

test("dashboard shows email when user has no name", async ({ page }) => {
  await page.route("**/auth/me", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          user: {
            id: "user_1",
            email: "ada@example.com",
            name: null,
          },
        },
        meta: {},
      }),
    });
  });

  await page.addInitScript(() => {
    localStorage.setItem("accessToken", "valid-token");
  });

  await page.goto("/dashboard");

  await expect(
    page.getByRole("heading", { name: "ada@example.com" }),
  ).toBeVisible();
});
