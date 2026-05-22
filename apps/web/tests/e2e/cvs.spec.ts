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
  await mockAuthMe(page);
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
  await mockAuthMe(page);
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
    page.getByText("No CVs yet. Upload your first CV to start your library."),
  ).toBeVisible();
});

test("CV management uploads a file and refreshes CV list", async ({
  page,
}) => {
  let getCount = 0;

  await mockAuthMe(page);
  await page.route("**://*/cvs/upload", async (route) => {
    const request = route.request();
    expect(request.method()).toBe("POST");
    expect(request.headers().authorization).toBe("Bearer valid-token");
    expect(request.headers()["content-type"]).toContain("multipart/form-data");
    expect(request.postDataBuffer()?.toString()).toContain(
      'name="file"; filename="ada-cv.pdf"',
    );

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
  await page.route("**://*/cvs", async (route) => {
    const request = route.request();
    expect(request.method()).toBe("GET");
    expect(request.headers().authorization).toBe("Bearer valid-token");

    getCount += 1;
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        data: getCount === 1 ? [] : cvList,
        meta: {},
      }),
    });
  });
  await page.addInitScript(() => {
    localStorage.setItem("accessToken", "valid-token");
  });

  await page.goto("/dashboard/cvs");
  await page.getByLabel("CV file").setInputFiles({
    name: "ada-cv.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4 test cv"),
  });
  await page.getByRole("button", { name: "Upload CV" }).click();

  await expect(page.getByRole("button", { name: "Uploading..." })).toBeDisabled();
  await expect(page.getByText("CV uploaded successfully.")).toBeVisible();
  await expect(page.getByText("Backend CV")).toBeVisible();
  expect(getCount).toBe(2);
});

test("CV analysis success displays result", async ({ page }) => {
  await mockAuthMe(page);
  await mockCvs(page, cvList);
  await page.route("**://*/cvs/*/analyze", async (route) => {
    const request = route.request();
    expect(request.method()).toBe("POST");
    expect(request.headers().authorization).toBe("Bearer valid-token");
    expect(request.url()).toContain(`/cvs/${cvList[0].id}/analyze`);

    await new Promise((resolve) => setTimeout(resolve, 100));

    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          id: "2f8d69b3-9274-496d-a9a4-2df643f0fe9a",
          cvId: cvList[0].id,
          type: "CV_ANALYSIS",
          aiProvider: "mock",
          aiModel: "mock-cv-analyzer-v1",
          result: {
            score: 82,
            strengths: ["Clear technical experience"],
            weaknesses: ["Impact metrics are limited"],
            suggestions: ["Add quantified achievements"],
          },
          createdAt: "2026-05-22T11:00:00.000Z",
        },
        meta: {},
      }),
    });
  });
  await page.addInitScript(() => {
    localStorage.setItem("accessToken", "valid-token");
  });

  await page.goto("/dashboard/cvs");
  await page.getByRole("button", { name: "Analyze" }).click();

  await expect(
    page.getByRole("button", { name: "Analyzing..." }),
  ).toBeDisabled();
  await expect(
    page.getByRole("region", { name: "Analysis result for Backend CV" }),
  ).toBeVisible();
  await expect(page.getByText("Score: 82")).toBeVisible();
  await expect(page.getByText("Clear technical experience")).toBeVisible();
  await expect(page.getByText("Impact metrics are limited")).toBeVisible();
  await expect(page.getByText("Add quantified achievements")).toBeVisible();
});

test("CV analysis API error displays error", async ({ page }) => {
  await mockAuthMe(page);
  await mockCvs(page, cvList);
  await page.route("**://*/cvs/*/analyze", async (route) => {
    const request = route.request();
    expect(request.method()).toBe("POST");
    expect(request.headers().authorization).toBe("Bearer valid-token");

    await route.fulfill({
      status: 422,
      contentType: "application/json",
      body: JSON.stringify({
        error: {
          code: "CV_TEXT_NOT_EXTRACTED",
          message: "CV text has not been extracted",
        },
        meta: {},
      }),
    });
  });
  await page.addInitScript(() => {
    localStorage.setItem("accessToken", "valid-token");
  });

  await page.goto("/dashboard/cvs");
  await page.getByRole("button", { name: "Analyze" }).click();

  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "CV text has not been extracted" }),
  ).toBeVisible();
});

test("CV management clears invalid token and redirects to login", async ({
  page,
}) => {
  await page.route("**://*/auth/me", async (route) => {
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

  await page.goto("/dashboard/cvs");

  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.evaluate(() => localStorage.getItem("accessToken")),
  ).resolves.toBeNull();
});

test("CV management shows upload API error message", async ({ page }) => {
  await mockAuthMe(page);
  await page.route("**://*/cvs", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        data: [],
        meta: {},
      }),
    });
  });
  await page.route("**://*/cvs/upload", async (route) => {
    const request = route.request();
    expect(request.method()).toBe("POST");
    expect(request.headers().authorization).toBe("Bearer valid-token");

    await route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({
        error: {
          code: "UNSUPPORTED_CV_FILE",
          message: "Only PDF, DOC, and DOCX files are supported.",
        },
        meta: {},
      }),
    });
  });
  await page.addInitScript(() => {
    localStorage.setItem("accessToken", "valid-token");
  });

  await page.goto("/dashboard/cvs");
  await page.getByLabel("CV file").setInputFiles({
    name: "ada-cv.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4 test cv"),
  });
  await page.getByRole("button", { name: "Upload CV" }).click();

  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Only PDF, DOC, and DOCX files are supported." }),
  ).toBeVisible();
});

async function mockCvs(
  page: import("@playwright/test").Page,
  data: typeof cvList,
) {
  await page.route("**://*/cvs", async (route) => {
    const request = route.request();
    expect(request.method()).toBe("GET");
    expect(request.headers().authorization).toBe("Bearer valid-token");

    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        data,
        meta: {},
      }),
    });
  });
}

async function mockAuthMe(page: import("@playwright/test").Page) {
  await page.route("**://*/auth/me", async (route) => {
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
}
