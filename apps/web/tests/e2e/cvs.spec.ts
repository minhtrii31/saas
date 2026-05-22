import { expect, test } from "@playwright/test";

const cvList = [
  {
    id: "57db9a57-197d-40b5-8be5-5a5dfe398912",
    title: "Backend CV",
    originalName: "ada-cv.pdf",
    mimeType: "application/pdf",
    sizeBytes: 123456,
    storageProvider: "s3",
    storageKey: "users/ada/ada-cv.pdf",
    storageUrl: "https://storage.example.com/users/ada/ada-cv.pdf",
    extractedText: null,
    createdAt: "2026-05-22T10:30:00.000Z",
  },
];

test("CV management redirects to login when token is missing", async ({
  page,
}) => {
  await page.goto("/dashboard/cvs");

  await expect(page).toHaveURL(/\/login$/);
});

test("CV management loads and displays CV list with a valid token", async ({
  page,
}) => {
  await page.route("**://*/cvs", async (route) => {
    const request = route.request();
    expect(request.method()).toBe("GET");
    expect(request.headers().authorization).toBe("Bearer valid-token");

    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        data: cvList,
        meta: {},
      }),
    });
  });
  await page.addInitScript(() => {
    localStorage.setItem("accessToken", "valid-token");
  });

  await page.goto("/dashboard/cvs");

  await expect(
    page.getByRole("heading", { name: "CVs", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Backend CV")).toBeVisible();
  await expect(page.getByText("ada-cv.pdf", { exact: true })).toBeVisible();
  await expect(page.getByText("users/ada/ada-cv.pdf")).toBeVisible();
});

test("CV management shows empty state", async ({ page }) => {
  await page.route("**://*/cvs", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        data: [],
        meta: {},
      }),
    });
  });
  await page.addInitScript(() => {
    localStorage.setItem("accessToken", "valid-token");
  });

  await page.goto("/dashboard/cvs");

  await expect(
    page.getByText("No CVs yet. Create CV metadata to start your library."),
  ).toBeVisible();
});

test("CV management creates metadata and refreshes CV list", async ({
  page,
}) => {
  let getCount = 0;

  await page.route("**://*/cvs", async (route) => {
    const request = route.request();
    expect(request.headers().authorization).toBe("Bearer valid-token");

    if (request.method() === "GET") {
      getCount += 1;
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          data: getCount === 1 ? [] : cvList,
          meta: {},
        }),
      });
      return;
    }

    expect(request.method()).toBe("POST");
    expect(request.postDataJSON()).toEqual({
      title: "Backend CV",
      originalName: "ada-cv.pdf",
      mimeType: "application/pdf",
      sizeBytes: 123456,
      storageProvider: "s3",
      storageKey: "users/ada/ada-cv.pdf",
      storageUrl: "https://storage.example.com/users/ada/ada-cv.pdf",
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        data: cvList[0],
        meta: {},
      }),
    });
  });
  await page.addInitScript(() => {
    localStorage.setItem("accessToken", "valid-token");
  });

  await page.goto("/dashboard/cvs");
  await page.getByLabel("Title").fill("Backend CV");
  await page.getByLabel("Original file name").fill("ada-cv.pdf");
  await page.getByLabel("Size in bytes").fill("123456");
  await page.getByLabel("Storage key").fill("users/ada/ada-cv.pdf");
  await page
    .getByLabel("Storage URL")
    .fill("https://storage.example.com/users/ada/ada-cv.pdf");
  await page.getByRole("button", { name: "Create CV" }).click();

  await expect(page.getByRole("button", { name: "Creating..." })).toBeDisabled();
  await expect(page.getByText("CV metadata created successfully.")).toBeVisible();
  await expect(page.getByText("Backend CV")).toBeVisible();
  expect(getCount).toBe(2);
});

test("CV management shows API error message", async ({ page }) => {
  await page.route("**://*/cvs", async (route) => {
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({
        error: {
          code: "CV_LIST_FAILED",
          message: "Unable to list CVs.",
        },
        meta: {},
      }),
    });
  });
  await page.addInitScript(() => {
    localStorage.setItem("accessToken", "valid-token");
  });

  await page.goto("/dashboard/cvs");

  await expect(
    page.getByRole("alert").filter({ hasText: "Unable to list CVs." }),
  ).toBeVisible();
});
