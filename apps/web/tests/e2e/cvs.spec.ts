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
    extractedText: "Ada Lovelace\nBackend Engineer\nTypeScript and NestJS",
    createdAt: "2026-05-22T10:30:00.000Z",
  },
];

const cvAnalysis = {
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
};

const matchAnalysis = {
  id: "jd-match-1",
  cvId: cvList[0].id,
  type: "JD_MATCH",
  jobDescriptionText: "We need TypeScript, NestJS, Redis, and PostgreSQL experience.",
  aiProvider: "mock",
  aiModel: "mock-jd-matcher-v1",
  result: {
    matchingScore: 75,
    matchedSkills: ["TypeScript", "NestJS", "PostgreSQL"],
    missingSkills: ["Redis"],
    suggestions: ["Add Redis project examples"],
  },
  createdAt: "2026-05-22T11:30:00.000Z",
};

const coverLetterAnalysis = {
  id: "cover-letter-1",
  cvId: cvList[0].id,
  type: "COVER_LETTER",
  jobDescriptionText: "Build APIs with TypeScript, NestJS, and PostgreSQL.",
  aiProvider: "mock",
  aiModel: "mock-cover-letter-v1",
  result: {
    coverLetter:
      "Dear Acme team,\n\nI am excited to apply for the Backend Engineer role.",
    tone: "professional",
    highlights: ["TypeScript API experience", "PostgreSQL delivery"],
  },
  createdAt: "2026-05-22T12:30:00.000Z",
};

test("/dashboard/cvs redirects to login when token is missing", async ({
  page,
}) => {
  await page.goto("/dashboard/cvs");

  await expect(page).toHaveURL(/\/login$/);
});

test("/dashboard/cvs shows CV list for an authenticated user", async ({
  page,
}) => {
  await mockAuthenticatedPage(page);
  await mockCvs(page, cvList);

  await page.goto("/dashboard/cvs");

  await expect(
    page.getByRole("heading", { name: "CVs", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Backend CV")).toBeVisible();
  await expect(page.getByText("ada-cv.pdf", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "View detail" })).toBeVisible();
});

test("/dashboard/cvs shows empty state", async ({ page }) => {
  await mockAuthenticatedPage(page);
  await mockCvs(page, []);

  await page.goto("/dashboard/cvs");

  await expect(
    page.getByText("No CVs yet. Upload your first CV to start your library."),
  ).toBeVisible();
});

test("/dashboard/cvs upload success refreshes list", async ({ page }) => {
  let getCount = 0;

  await mockAuthenticatedPage(page);
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
      body: JSON.stringify({ data: cvList[0], meta: {} }),
    });
  });
  await page.route("**://*/cvs", async (route) => {
    const request = route.request();
    expect(request.method()).toBe("GET");
    expect(request.headers().authorization).toBe("Bearer valid-token");

    getCount += 1;
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ data: getCount === 1 ? [] : cvList, meta: {} }),
    });
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
  expect(getCount).toBeGreaterThanOrEqual(2);
});

test("/dashboard/cvs shows upload API error", async ({ page }) => {
  await mockAuthenticatedPage(page);
  await mockCvs(page, []);
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

test("/dashboard/cvs clears invalid token and redirects", async ({ page }) => {
  await mockInvalidAuthMe(page);
  await page.addInitScript(() => {
    localStorage.setItem("accessToken", "invalid-token");
  });

  await page.goto("/dashboard/cvs");

  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.evaluate(() => localStorage.getItem("accessToken")),
  ).resolves.toBeNull();
});

test("/dashboard/cvs/[id] shows CV metadata and extracted text", async ({
  page,
}) => {
  await mockAuthenticatedPage(page);
  await page.route(`**://*/cvs/${cvList[0].id}`, async (route) => {
    const request = route.request();
    expect(request.method()).toBe("GET");
    expect(request.headers().authorization).toBe("Bearer valid-token");

    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ data: cvList[0], meta: {} }),
    });
  });

  await page.goto(`/dashboard/cvs/${cvList[0].id}`);

  await expect(page.getByRole("heading", { name: "CV detail" })).toBeVisible();
  await expect(page.getByText("Backend CV")).toBeVisible();
  await expect(
    page.getByText("users/ada/ada-cv.pdf", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("TypeScript and NestJS")).toBeVisible();
});

test("/dashboard/analyze can select CV and displays result", async ({
  page,
}) => {
  await mockAuthenticatedPage(page);
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
      body: JSON.stringify({ data: cvAnalysis, meta: {} }),
    });
  });

  await page.goto("/dashboard/analyze");
  await page.getByLabel("CV").selectOption(cvList[0].id);
  await page.getByRole("button", { name: "Analyze CV" }).click();

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

test("/dashboard/analyze API error displays error", async ({ page }) => {
  await mockAuthenticatedPage(page);
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

  await page.goto("/dashboard/analyze");
  await page.getByRole("button", { name: "Analyze CV" }).click();

  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "CV text has not been extracted" }),
  ).toBeVisible();
});

test("/dashboard/match can select CV and submit JD", async ({ page }) => {
  await mockAuthenticatedPage(page);
  await mockCvs(page, cvList);
  await page.route("**://*/cvs/*/match", async (route) => {
    const request = route.request();
    expect(request.method()).toBe("POST");
    expect(request.headers().authorization).toBe("Bearer valid-token");
    expect(request.url()).toContain(`/cvs/${cvList[0].id}/match`);
    expect(request.postDataJSON()).toEqual({
      jobDescriptionText:
        "We need TypeScript, NestJS, Redis, and PostgreSQL experience.",
    });

    await new Promise((resolve) => setTimeout(resolve, 100));
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ data: matchAnalysis, meta: {} }),
    });
  });

  await page.goto("/dashboard/match");
  await page.getByLabel("CV").selectOption(cvList[0].id);
  await page
    .getByLabel("Job description")
    .fill("We need TypeScript, NestJS, Redis, and PostgreSQL experience.");
  await page.getByRole("button", { name: "Run match" }).click();

  await expect(page.getByRole("button", { name: "Matching..." })).toBeDisabled();
  await expect(
    page.getByRole("region", { name: "JD match result for Backend CV" }),
  ).toBeVisible();
  await expect(page.getByText("Matching score: 75")).toBeVisible();
  await expect(page.getByText("TypeScript")).toBeVisible();
  await expect(page.getByText("Redis", { exact: true })).toBeVisible();
  await expect(page.getByText("Add Redis project examples")).toBeVisible();
});

test("/dashboard/match empty JD validation works", async ({ page }) => {
  await mockAuthenticatedPage(page);
  await mockCvs(page, cvList);

  await page.goto("/dashboard/match");
  await page.getByRole("button", { name: "Run match" }).click();

  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Enter a job description before matching." }),
  ).toBeVisible();
});

test("/dashboard/match API error displays error", async ({ page }) => {
  await mockAuthenticatedPage(page);
  await mockCvs(page, cvList);
  await page.route("**://*/cvs/*/match", async (route) => {
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

  await page.goto("/dashboard/match");
  await page.getByLabel("Job description").fill("We need TypeScript.");
  await page.getByRole("button", { name: "Run match" }).click();

  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "CV text has not been extracted" }),
  ).toBeVisible();
});

test("/dashboard/cover-letter can generate cover letter", async ({ page }) => {
  await mockAuthenticatedPage(page);
  await mockCvs(page, cvList);
  await page.route("**://*/cvs/*/cover-letter", async (route) => {
    const request = route.request();
    expect(request.method()).toBe("POST");
    expect(request.headers().authorization).toBe("Bearer valid-token");
    expect(request.url()).toContain(`/cvs/${cvList[0].id}/cover-letter`);
    expect(request.postDataJSON()).toEqual({
      jobDescriptionText: "Build APIs with TypeScript, NestJS, and PostgreSQL.",
      companyName: "Acme",
      roleTitle: "Backend Engineer",
      tone: "professional",
    });

    await new Promise((resolve) => setTimeout(resolve, 100));
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ data: coverLetterAnalysis, meta: {} }),
    });
  });

  await page.goto("/dashboard/cover-letter");
  await page.getByLabel("CV").selectOption(cvList[0].id);
  await page
    .getByLabel("Job description")
    .fill("Build APIs with TypeScript, NestJS, and PostgreSQL.");
  await page.getByLabel("Company name").fill("Acme");
  await page.getByLabel("Role title").fill("Backend Engineer");
  await page.getByRole("button", { name: "Generate", exact: true }).click();

  await expect(
    page.getByRole("button", { name: "Generating..." }),
  ).toBeDisabled();
  await expect(
    page.getByRole("region", { name: "Cover letter result for Backend CV" }),
  ).toBeVisible();
  await expect(
    page.getByText("I am excited to apply for the Backend Engineer role."),
  ).toBeVisible();
  await expect(page.getByText("Tone: professional")).toBeVisible();
  await expect(page.getByText("TypeScript API experience")).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy" })).toBeVisible();
});

test("/dashboard/cover-letter empty JD validation works", async ({ page }) => {
  await mockAuthenticatedPage(page);
  await mockCvs(page, cvList);

  await page.goto("/dashboard/cover-letter");
  await page.getByRole("button", { name: "Generate", exact: true }).click();

  await expect(
    page
      .getByRole("alert")
      .filter({
        hasText: "Enter a job description before generating a cover letter.",
      }),
  ).toBeVisible();
});

test("/dashboard/cover-letter API error displays error", async ({ page }) => {
  await mockAuthenticatedPage(page);
  await mockCvs(page, cvList);
  await page.route("**://*/cvs/*/cover-letter", async (route) => {
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

  await page.goto("/dashboard/cover-letter");
  await page.getByLabel("Job description").fill("Build APIs with TypeScript.");
  await page.getByRole("button", { name: "Generate", exact: true }).click();

  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "CV text has not been extracted" }),
  ).toBeVisible();
});

test("/dashboard/history shows saved analysis history", async ({ page }) => {
  await mockAuthenticatedPage(page);
  await mockCvs(page, cvList);
  await page.route("**://*/cvs/*/analyses", async (route) => {
    const request = route.request();
    expect(request.method()).toBe("GET");
    expect(request.headers().authorization).toBe("Bearer valid-token");
    expect(request.url()).toContain(`/cvs/${cvList[0].id}/analyses`);

    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        data: [cvAnalysis, matchAnalysis, coverLetterAnalysis],
        meta: {},
      }),
    });
  });

  await page.goto("/dashboard/history");

  const history = page.getByRole("region", { name: "Analysis history" });
  await expect(history.getByText("Backend CV").first()).toBeVisible();
  await expect(history.getByText("Score: 82")).toBeVisible();
  await expect(history.getByText("Matching score: 75")).toBeVisible();
  await expect(
    history.getByText("I am excited to apply for the Backend Engineer role."),
  ).toBeVisible();
});

test("/dashboard/history empty state works", async ({ page }) => {
  await mockAuthenticatedPage(page);
  await mockCvs(page, cvList);
  await page.route("**://*/cvs/*/analyses", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ data: [], meta: {} }),
    });
  });

  await page.goto("/dashboard/history");

  await expect(
    page.getByText("No analysis history yet. Run an analysis to create one."),
  ).toBeVisible();
});

async function mockAuthenticatedPage(page: import("@playwright/test").Page) {
  await mockAuthMe(page);
  await page.addInitScript(() => {
    localStorage.setItem("accessToken", "valid-token");
  });
}

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
      body: JSON.stringify({ data, meta: {} }),
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
          id: "user_1",
          email: "ada@example.com",
          name: "Ada Lovelace",
        },
        meta: {},
      }),
    });
  });
}

async function mockInvalidAuthMe(page: import("@playwright/test").Page) {
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
}
