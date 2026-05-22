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

test("CV JD match success displays result", async ({ page }) => {
  await mockAuthMe(page);
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
      body: JSON.stringify({
        data: {
          id: "jd-match-1",
          cvId: cvList[0].id,
          type: "JD_MATCH",
          jobDescriptionText:
            "We need TypeScript, NestJS, Redis, and PostgreSQL experience.",
          aiProvider: "mock",
          aiModel: "mock-jd-matcher-v1",
          result: {
            matchingScore: 75,
            matchedSkills: ["TypeScript", "NestJS", "PostgreSQL"],
            missingSkills: ["Redis"],
            suggestions: ["Add Redis project examples"],
          },
          createdAt: "2026-05-22T11:30:00.000Z",
        },
        meta: {},
      }),
    });
  });
  await page.addInitScript(() => {
    localStorage.setItem("accessToken", "valid-token");
  });

  await page.goto("/dashboard/cvs");
  await page.getByRole("button", { name: "Match job description" }).click();
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
  await expect(page.getByText("NestJS")).toBeVisible();
  await expect(page.getByText("PostgreSQL")).toBeVisible();
  await expect(page.getByText("Redis", { exact: true })).toBeVisible();
  await expect(page.getByText("Add Redis project examples")).toBeVisible();
});

test("CV JD match empty job description displays validation error", async ({
  page,
}) => {
  await mockAuthMe(page);
  await mockCvs(page, cvList);
  await page.addInitScript(() => {
    localStorage.setItem("accessToken", "valid-token");
  });

  await page.goto("/dashboard/cvs");
  await page.getByRole("button", { name: "Match job description" }).click();
  await page.getByRole("button", { name: "Run match" }).click();

  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Enter a job description before matching." }),
  ).toBeVisible();
});

test("CV JD match API error displays error", async ({ page }) => {
  await mockAuthMe(page);
  await mockCvs(page, cvList);
  await page.route("**://*/cvs/*/match", async (route) => {
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
  await page.getByRole("button", { name: "Match job description" }).click();
  await page
    .getByLabel("Job description")
    .fill("We need TypeScript and Redis experience.");
  await page.getByRole("button", { name: "Run match" }).click();

  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "CV text has not been extracted" }),
  ).toBeVisible();
});

test("CV cover letter generation success displays result", async ({ page }) => {
  await mockAuthMe(page);
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
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          id: "cover-letter-1",
          cvId: cvList[0].id,
          type: "COVER_LETTER",
          jobDescriptionText:
            "Build APIs with TypeScript, NestJS, and PostgreSQL.",
          aiProvider: "mock",
          aiModel: "mock-cover-letter-v1",
          result: {
            coverLetter:
              "Dear Acme team,\n\nI am excited to apply for the Backend Engineer role.",
            tone: "professional",
            highlights: ["TypeScript API experience", "PostgreSQL delivery"],
          },
          createdAt: "2026-05-22T12:30:00.000Z",
        },
        meta: {},
      }),
    });
  });
  await page.addInitScript(() => {
    localStorage.setItem("accessToken", "valid-token");
  });

  await page.goto("/dashboard/cvs");
  await page.getByRole("button", { name: "Generate cover letter" }).click();
  await page
    .getByRole("region", { name: "Cover letter generation for Backend CV" })
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
  await expect(page.getByText("PostgreSQL delivery")).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy" })).toBeVisible();
});

test("CV cover letter missing job description displays validation error", async ({
  page,
}) => {
  await mockAuthMe(page);
  await mockCvs(page, cvList);
  await page.addInitScript(() => {
    localStorage.setItem("accessToken", "valid-token");
  });

  await page.goto("/dashboard/cvs");
  await page.getByRole("button", { name: "Generate cover letter" }).click();
  await page.getByRole("button", { name: "Generate", exact: true }).click();

  await expect(
    page
      .getByRole("alert")
      .filter({
        hasText: "Enter a job description before generating a cover letter.",
      }),
  ).toBeVisible();
});

test("CV cover letter API error displays error", async ({ page }) => {
  await mockAuthMe(page);
  await mockCvs(page, cvList);
  await page.route("**://*/cvs/*/cover-letter", async (route) => {
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
  await page.getByRole("button", { name: "Generate cover letter" }).click();
  await page
    .getByRole("region", { name: "Cover letter generation for Backend CV" })
    .getByLabel("Job description")
    .fill("Build APIs with TypeScript.");
  await page.getByRole("button", { name: "Generate", exact: true }).click();

  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "CV text has not been extracted" }),
  ).toBeVisible();
});

test("CV analysis history success displays analysis items", async ({
  page,
}) => {
  await mockAuthMe(page);
  await mockCvs(page, cvList);
  await page.route("**://*/cvs/*/analyses", async (route) => {
    const request = route.request();
    expect(request.method()).toBe("GET");
    expect(request.headers().authorization).toBe("Bearer valid-token");
    expect(request.url()).toContain(`/cvs/${cvList[0].id}/analyses`);

    await new Promise((resolve) => setTimeout(resolve, 100));

    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        data: [
          {
            id: "old-analysis",
            cvId: cvList[0].id,
            type: "CV_ANALYSIS",
            aiProvider: "mock",
            aiModel: "mock-cv-analyzer-v1",
            result: {
              score: 71,
              strengths: ["Readable layout"],
              weaknesses: ["Missing role impact"],
              suggestions: ["Add business outcomes"],
            },
            createdAt: "2026-05-22T09:00:00.000Z",
          },
          {
            id: "new-analysis",
            cvId: cvList[0].id,
            type: "CV_ANALYSIS",
            aiProvider: "mock",
            aiModel: "mock-cv-analyzer-v1",
            result: {
              score: 86,
              strengths: ["Strong backend scope"],
              weaknesses: ["Few metrics"],
              suggestions: ["Quantify latency improvements"],
            },
            createdAt: "2026-05-22T12:00:00.000Z",
          },
        ],
        meta: {},
      }),
    });
  });
  await page.addInitScript(() => {
    localStorage.setItem("accessToken", "valid-token");
  });

  await page.goto("/dashboard/cvs");
  await page.getByRole("button", { name: "View history" }).click();

  await expect(
    page.getByRole("button", { name: "Loading history..." }),
  ).toBeDisabled();
  await expect(
    page.getByRole("region", { name: "Analysis history for Backend CV" }),
  ).toBeVisible();
  await expect(page.getByText("Score: 86")).toBeVisible();
  await expect(page.getByText("Strong backend scope")).toBeVisible();
  await expect(page.getByText("Few metrics")).toBeVisible();
  await expect(page.getByText("Quantify latency improvements")).toBeVisible();
  await expect(page.getByText("Score: 71")).toBeVisible();

  const scores = page
    .getByRole("region", { name: "Analysis history for Backend CV" })
    .getByText(/Score: \d+/);
  await expect(scores).toHaveText(["Score: 86", "Score: 71"]);
});

test("CV analysis history displays cover letter items", async ({ page }) => {
  await mockAuthMe(page);
  await mockCvs(page, cvList);
  await page.route("**://*/cvs/*/analyses", async (route) => {
    const request = route.request();
    expect(request.method()).toBe("GET");
    expect(request.headers().authorization).toBe("Bearer valid-token");

    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        data: [
          {
            id: "cover-letter-history",
            cvId: cvList[0].id,
            type: "COVER_LETTER",
            jobDescriptionText: "Build APIs with TypeScript.",
            aiProvider: "mock",
            aiModel: "mock-cover-letter-v1",
            result: {
              coverLetter:
                "Dear hiring team,\n\nI can bring TypeScript API experience to this role.",
              tone: "confident",
              highlights: ["TypeScript API experience"],
            },
            createdAt: "2026-05-22T12:30:00.000Z",
          },
        ],
        meta: {},
      }),
    });
  });
  await page.addInitScript(() => {
    localStorage.setItem("accessToken", "valid-token");
  });

  await page.goto("/dashboard/cvs");
  await page.getByRole("button", { name: "View history" }).click();

  const historyRegion = page.getByRole("region", {
    name: "Analysis history for Backend CV",
  });

  await expect(historyRegion.getByText("Cover letter")).toBeVisible();
  await expect(
    historyRegion.getByText(
      "I can bring TypeScript API experience to this role.",
    ),
  ).toBeVisible();
  await expect(historyRegion.getByText("Tone: confident")).toBeVisible();
  await expect(
    historyRegion.getByText("TypeScript API experience", { exact: true }),
  ).toBeVisible();
});

test("CV analysis history empty displays empty state", async ({ page }) => {
  await mockAuthMe(page);
  await mockCvs(page, cvList);
  await page.route("**://*/cvs/*/analyses", async (route) => {
    const request = route.request();
    expect(request.method()).toBe("GET");
    expect(request.headers().authorization).toBe("Bearer valid-token");

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
  await page.getByRole("button", { name: "View history" }).click();

  await expect(
    page.getByText("No analysis history yet. Run an analysis to create one."),
  ).toBeVisible();
});

test("CV analysis history API error displays error", async ({ page }) => {
  await mockAuthMe(page);
  await mockCvs(page, cvList);
  await page.route("**://*/cvs/*/analyses", async (route) => {
    const request = route.request();
    expect(request.method()).toBe("GET");
    expect(request.headers().authorization).toBe("Bearer valid-token");

    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({
        error: {
          code: "ANALYSIS_HISTORY_UNAVAILABLE",
          message: "Analysis history is unavailable.",
        },
        meta: {},
      }),
    });
  });
  await page.addInitScript(() => {
    localStorage.setItem("accessToken", "valid-token");
  });

  await page.goto("/dashboard/cvs");
  await page.getByRole("button", { name: "View history" }).click();

  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Analysis history is unavailable." }),
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
