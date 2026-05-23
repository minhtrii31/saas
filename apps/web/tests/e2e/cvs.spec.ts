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

const cvLibraryList = [
  {
    ...cvList[0],
    id: "cv-latest",
    title: "Backend CV latest",
    originalName: "ada-backend.pdf",
    sizeBytes: 150000,
    createdAt: "2026-05-23T10:30:00.000Z",
  },
  {
    ...cvList[0],
    id: "cv-version-2",
    title: null,
    originalName: "ada-backend.pdf",
    sizeBytes: 140000,
    createdAt: "2026-05-22T10:30:00.000Z",
  },
  {
    ...cvList[0],
    id: "cv-product",
    title: "Product CV",
    originalName: "ada-product.pdf",
    extractedText: null,
    sizeBytes: 130000,
    createdAt: "2026-05-21T10:30:00.000Z",
  },
  {
    ...cvList[0],
    id: "cv-version-1",
    title: null,
    originalName: "ada-backend.pdf",
    sizeBytes: 120000,
    createdAt: "2026-05-20T10:30:00.000Z",
  },
  {
    ...cvList[0],
    id: "cv-data",
    title: "Data CV",
    originalName: "ada-data.pdf",
    sizeBytes: 110000,
    createdAt: "2026-05-19T10:30:00.000Z",
  },
  {
    ...cvList[0],
    id: "cv-old",
    title: "Old CV",
    originalName: "ada-old.pdf",
    sizeBytes: 100000,
    createdAt: "2026-05-18T10:30:00.000Z",
  },
];

const jobTargets = [
  {
    id: "a9df94a5-b938-4932-ac3c-7c99d6380b12",
    userId: "user_1",
    title: "Backend Engineer",
    companyName: "Acme",
    jobDescriptionText: "Build APIs with TypeScript, NestJS, and PostgreSQL.",
    createdAt: "2026-05-23T09:00:00.000Z",
    updatedAt: "2026-05-23T10:00:00.000Z",
  },
];

const applications = [
  {
    id: "87df9cdb-9386-4676-8cbe-07f85d110dd4",
    userId: "user_1",
    cvId: cvList[0].id,
    jobTargetId: jobTargets[0].id,
    companyName: "Acme",
    roleTitle: "Backend Engineer",
    status: "APPLIED",
    appliedAt: "2026-05-23T08:00:00.000Z",
    notes: "Follow up next week.",
    createdAt: "2026-05-23T09:00:00.000Z",
    updatedAt: "2026-05-23T10:00:00.000Z",
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
    scoringCategories: {
      atsReadiness: 88,
      readability: 84,
      impact: 70,
      keywordOptimization: 76,
      structure: 90,
      experienceQuality: 81,
    },
    strengths: ["Clear technical experience"],
    weaknesses: ["Impact metrics are limited"],
    actionableInsights: {
      missingQuantifiedAchievements: ["Add delivery metrics to backend work"],
      weakActionVerbs: ["Replace helped with led or delivered"],
      missingSections: ["Add a technical skills section"],
      overlyGenericWording: ["Clarify ownership in project summaries"],
      formattingConcerns: ["Keep section headings consistent"],
      keywordGaps: ["Add Redis and queue processing keywords"],
    },
    suggestions: ["Add quantified achievements"],
  },
  createdAt: "2026-05-22T11:00:00.000Z",
};

const legacyCvAnalysis = {
  id: "legacy-cv-analysis-1",
  cvId: cvList[0].id,
  type: "CV_ANALYSIS",
  aiProvider: "mock",
  aiModel: "mock-cv-analyzer-v1",
  result: {
    score: 68,
    strengths: ["Concise summary"],
    weaknesses: ["Missing project outcomes"],
    suggestions: ["Add stronger bullet evidence"],
  },
  createdAt: "2026-05-22T10:45:00.000Z",
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

const rewriteAnalysis = {
  id: "resume-rewrite-1",
  cvId: cvList[0].id,
  type: "RESUME_REWRITE",
  aiProvider: "mock",
  aiModel: "mock-resume-rewriter-v1",
  result: {
    goal: "stronger-impact",
    suggestions: [
      {
        original: "Worked on backend APIs for customer workflows.",
        improved:
          "Delivered customer workflow APIs that reduced manual review time by 35%.",
        reason:
          "The revised bullet uses an action verb and adds measurable business impact.",
      },
    ],
  },
  createdAt: "2026-05-22T13:30:00.000Z",
};

const rewriteRefinementAnalysis = {
  id: "rewrite-refinement-1",
  cvId: cvList[0].id,
  type: "REWRITE_REFINEMENT",
  aiProvider: "mock",
  aiModel: "mock-resume-rewriter-v1",
  result: {
    improved:
      "Owned customer workflow API delivery with TypeScript, reducing manual review time by 35%.",
    reason:
      "The refined rewrite adds technical detail while preserving the measurable result.",
  },
  createdAt: "2026-05-22T13:45:00.000Z",
};

const interviewPrepAnalysis = {
  id: "interview-prep-1",
  cvId: cvList[0].id,
  type: "INTERVIEW_PREP",
  jobDescriptionText: "Build APIs with TypeScript, NestJS, and PostgreSQL.",
  aiProvider: "mock",
  aiModel: "mock-interview-prep-v1",
  result: {
    focus: "mixed",
    questions: [
      {
        question: "Tell me about a TypeScript API you improved.",
        whyItMatters: "Tests ownership and backend impact.",
        suggestedAnswerDirection:
          "Use one recent API example with scope, tradeoffs, and outcome.",
        starGuidance: {
          situation: "Backend platform context",
          task: "Improve API reliability",
          action: "Led TypeScript and NestJS changes",
          result: "Reduced manual review time",
        },
      },
      {
        question: "What tradeoffs would you consider for PostgreSQL design?",
        whyItMatters: "Tests practical technical depth.",
        suggestedAnswerDirection:
          "Discuss query shape, indexes, migrations, and operational risk.",
      },
      {
        question: "How would you address limited Redis experience?",
        whyItMatters: "Tests honesty around gaps.",
        suggestedAnswerDirection:
          "Connect adjacent caching or queue work without overstating experience.",
        starGuidance: {
          situation: "Role asks for Redis",
          task: "Close a skill gap",
          action: "Prepare adjacent examples and learning plan",
          result: "Reduce onboarding risk",
        },
      },
    ],
    weakPointFocusAreas: ["Prepare Redis bridge answers"],
  },
  createdAt: "2026-05-22T14:00:00.000Z",
};

const cvProgress = {
  cvId: cvList[0].id,
  scoreTimeline: [
    {
      analysisId: legacyCvAnalysis.id,
      createdAt: "2026-05-22T10:45:00.000Z",
      score: 68,
    },
    {
      analysisId: cvAnalysis.id,
      createdAt: "2026-05-22T11:00:00.000Z",
      score: 82,
    },
  ],
  atsTrend: [
    {
      analysisId: legacyCvAnalysis.id,
      createdAt: "2026-05-22T10:45:00.000Z",
      score: 76,
    },
    {
      analysisId: cvAnalysis.id,
      createdAt: "2026-05-22T11:00:00.000Z",
      score: 88,
    },
  ],
  scoringCategoryTrends: [
    {
      analysisId: legacyCvAnalysis.id,
      createdAt: "2026-05-22T10:45:00.000Z",
      categories: {
        atsReadiness: 76,
        readability: 78,
        impact: 60,
        keywordOptimization: 64,
        structure: 82,
        experienceQuality: 72,
      },
    },
    {
      analysisId: cvAnalysis.id,
      createdAt: "2026-05-22T11:00:00.000Z",
      categories: {
        atsReadiness: 88,
        readability: 84,
        impact: 70,
        keywordOptimization: 76,
        structure: 90,
        experienceQuality: 81,
      },
    },
  ],
  rewriteActivityTrend: [
    {
      date: "2026-05-22",
      total: 3,
      resumeRewrite: 2,
      rewriteRefinement: 1,
    },
  ],
  improvementDeltas: {
    score: 14,
    atsReadiness: 12,
    keywordOptimization: 12,
    impact: 10,
  },
  summary: {
    earliestScore: 68,
    latestScore: 82,
    latestScoreVsEarliestScore: 14,
    totalScoreAnalyses: 2,
    totalRewriteActions: 3,
    rewritesThisWeek: 3,
    insights: [
      "ATS readiness improved +12",
      "3 rewrites generated this week",
      "Keyword optimization improved +12",
    ],
  },
};

const insufficientCreditsError = {
  error: {
    code: "INSUFFICIENT_CREDITS",
    message: "Insufficient credits for this action.",
  },
  meta: {},
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
    page.getByRole("heading", { name: "CV Library", exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByText("Current source")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Backend CV" })).toBeVisible();
  await expect(page.getByText("Ready").first()).toBeVisible();
  await expect(page.getByRole("link", { name: "View detail" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Match role" })).toBeVisible();
});

test("/dashboard/cvs shows empty state", async ({ page }) => {
  await mockAuthenticatedPage(page);
  await mockCvs(page, []);

  await page.goto("/dashboard/cvs");

  await expect(
    page.getByRole("heading", { name: "Add your first CV" }),
  ).toBeVisible();
  await expect(
    page.getByText("No CVs yet. Use the Add new CV form above"),
  ).toBeVisible();
});

test("/dashboard/cvs shows latest documents first and collapses older versions", async ({
  page,
}) => {
  await mockAuthenticatedPage(page);
  await mockCvs(page, cvLibraryList);

  await page.goto("/dashboard/cvs");

  await expect(page.getByRole("heading", { name: "CV Library" }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Backend CV latest" })).toBeVisible();
  await expect(page.getByText("3 versions").first()).toBeVisible();
  await expect(page.getByText("Latest version")).toBeVisible();
  await expect(page.getByText("Pending / Not extracted")).toBeVisible();
  await expect(page.getByText("Old CV")).toBeHidden();

  await page.getByRole("button", { name: "Show all documents (6)" }).click();

  await expect(page.getByText("Old CV")).toBeVisible();
  await expect(page.getByRole("button", { name: "Show latest 5" })).toBeVisible();
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
  await expect(page.getByRole("heading", { name: "Backend CV" })).toBeVisible();
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

test("/dashboard/job-targets creates, edits, and deletes saved targets", async ({
  page,
}) => {
  let targets = [...jobTargets];

  await mockAuthenticatedPage(page);
  await page.route("**://*/job-targets", async (route) => {
    const request = route.request();
    expect(request.headers().authorization).toBe("Bearer valid-token");

    if (request.method() === "GET") {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ data: targets, meta: {} }),
      });
      return;
    }

    expect(request.method()).toBe("POST");
    expect(request.postDataJSON()).toEqual({
      title: "Frontend Engineer",
      companyName: "Northstar",
      jobDescriptionText: "Build product interfaces with React and TypeScript.",
    });
    targets = [
      {
        id: "d575603f-cbf4-4462-b132-2573bd72651b",
        userId: "user_1",
        title: "Frontend Engineer",
        companyName: "Northstar",
        jobDescriptionText: "Build product interfaces with React and TypeScript.",
        createdAt: "2026-05-23T11:00:00.000Z",
        updatedAt: "2026-05-23T11:00:00.000Z",
      },
      ...targets,
    ];
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ data: targets[0], meta: {} }),
    });
  });
  await page.route("**://*/job-targets/*", async (route) => {
    const request = route.request();

    if (request.method() === "PATCH") {
      expect(request.postDataJSON()).toEqual({
        title: "Backend Engineer",
        companyName: "Acme AI",
        jobDescriptionText: jobTargets[0].jobDescriptionText,
      });
      targets = targets.map((target) =>
        target.id === jobTargets[0].id
          ? { ...target, companyName: "Acme AI" }
          : target,
      );
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ data: targets[1], meta: {} }),
      });
      return;
    }

    expect(request.method()).toBe("DELETE");
    targets = targets.filter((target) => target.id !== jobTargets[0].id);
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          id: jobTargets[0].id,
          deletedAt: "2026-05-23T12:00:00.000Z",
        },
        meta: {},
      }),
    });
  });

  await page.goto("/dashboard/job-targets");
  await expect(
    page.getByRole("heading", { name: "Job Targets", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Backend Engineer" }),
  ).toBeVisible();

  await page.getByLabel("Title").fill("Frontend Engineer");
  await page.getByLabel("Company name").fill("Northstar");
  await page
    .getByLabel("Job description")
    .fill("Build product interfaces with React and TypeScript.");
  await page.getByRole("button", { name: "Save target" }).click();
  await expect(page.getByText("Target saved.")).toBeVisible();
  await expect(page.getByText("Frontend Engineer")).toBeVisible();

  await page.getByRole("button", { name: "Edit Backend Engineer" }).click();
  await page.getByLabel("Company name").fill("Acme AI");
  await page.getByRole("button", { name: "Save target" }).click();
  await expect(page.getByText("Target updated.")).toBeVisible();
  await expect(page.getByText("Acme AI")).toBeVisible();

  await page.getByRole("button", { name: "Delete Backend Engineer" }).click();
  await expect(page.getByText("Backend Engineer")).toBeHidden();
});

test("/dashboard/applications tracks status and generates follow-up draft", async ({
  page,
}) => {
  let currentApplications = [...applications];

  await mockAuthenticatedPage(page);
  await mockCvs(page, cvList);
  await mockJobTargets(page, jobTargets);
  await page.route("**://*/applications", async (route) => {
    const request = route.request();
    expect(request.headers().authorization).toBe("Bearer valid-token");

    if (request.method() === "GET") {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ data: currentApplications, meta: {} }),
      });
      return;
    }

    expect(request.method()).toBe("POST");
    expect(request.postDataJSON()).toEqual({
      cvId: cvList[0].id,
      companyName: "Northstar",
      roleTitle: "Frontend Engineer",
      status: "SAVED",
      jobTargetId: jobTargets[0].id,
      notes: "Tailor portfolio examples.",
    });
    currentApplications = [
      {
        id: "d575603f-cbf4-4462-b132-2573bd72651b",
        userId: "user_1",
        cvId: cvList[0].id,
        jobTargetId: jobTargets[0].id,
        companyName: "Northstar",
        roleTitle: "Frontend Engineer",
        status: "SAVED",
        appliedAt: null,
        notes: "Tailor portfolio examples.",
        createdAt: "2026-05-23T11:00:00.000Z",
        updatedAt: "2026-05-23T11:00:00.000Z",
      },
      ...currentApplications,
    ];
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ data: currentApplications[0], meta: {} }),
    });
  });
  await page.route("**://*/applications/*/follow-up", async (route) => {
    const request = route.request();
    expect(request.method()).toBe("POST");
    expect(request.headers().authorization).toBe("Bearer valid-token");

    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          applicationId: applications[0].id,
          analysisId: "follow-up-1",
          draft:
            "Subject: Follow-up on Backend Engineer application\n\nHello Acme team,\n\nI wanted to follow up on my application.",
          tone: "professional",
          status: "INTERVIEWING",
        },
        meta: {},
      }),
    });
  });
  await page.route("**://*/applications/*", async (route) => {
    const request = route.request();

    if (request.method() === "PATCH") {
      const body = request.postDataJSON();
      if (body.status === "INTERVIEWING") {
        currentApplications = currentApplications.map((application) =>
          application.id === applications[0].id
            ? { ...application, status: "INTERVIEWING" }
            : application,
        );
      }
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ data: currentApplications[0], meta: {} }),
      });
      return;
    }

    expect(request.method()).toBe("DELETE");
    currentApplications = currentApplications.filter(
      (application) => application.id !== applications[0].id,
    );
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          id: applications[0].id,
          deletedAt: "2026-05-23T12:00:00.000Z",
        },
        meta: {},
      }),
    });
  });

  await page.goto("/dashboard/applications");
  await expect(
    page.getByRole("heading", { name: "Applications", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Backend Engineer" }),
  ).toBeVisible();
  await expect(page.getByText("Follow up next week.")).toBeVisible();

  await page.getByLabel("CV").selectOption(cvList[0].id);
  await page.getByLabel("Job target").selectOption(jobTargets[0].id);
  await page.getByLabel("Company name").fill("Northstar");
  await page.getByLabel("Role title").fill("Frontend Engineer");
  await page.getByLabel("Notes").fill("Tailor portfolio examples.");
  await page.getByRole("button", { name: "Save application" }).click();
  await expect(page.getByText("Application saved.")).toBeVisible();
  await expect(page.getByText("Frontend Engineer")).toBeVisible();

  await page
    .getByLabel(`Status`, { exact: true })
    .first()
    .selectOption("INTERVIEWING");
  await expect(
    page.getByRole("region", { name: "Interviewing applications" }),
  ).toContainText("Backend Engineer");

  await page
    .getByRole("button", { name: "Generate follow-up for Backend Engineer" })
    .click();
  await expect(
    page.getByText("Subject: Follow-up on Backend Engineer application"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Copy draft" }).click();
  await expect(page.getByRole("button", { name: "Copied" })).toBeVisible();
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
  await expect(page.getByText("Recruiter and ATS scorecard")).toBeVisible();
  await expect(page.getByText("ATS readiness")).toBeVisible();
  await expect(page.getByText("88")).toBeVisible();
  await expect(page.getByText("Actionable insight queue")).toBeVisible();
  await expect(page.getByText("Missing quantified achievements")).toBeVisible();
  await expect(page.getByText("Add delivery metrics to backend work")).toBeVisible();
  await expect(page.getByText("Add Redis and queue processing keywords")).toBeVisible();
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

test("/dashboard/analyze insufficient credits displays clear message", async ({
  page,
}) => {
  await mockAuthenticatedPage(page, 0);
  await mockCvs(page, cvList);
  await page.route("**://*/cvs/*/analyze", async (route) => {
    await route.fulfill({
      status: 402,
      contentType: "application/json",
      body: JSON.stringify(insufficientCreditsError),
    });
  });

  await page.goto("/dashboard/analyze");
  await page.getByRole("button", { name: "Analyze CV" }).click();

  await expect(
    page.getByRole("alert").filter({ hasText: "You’re out of credits." }),
  ).toBeVisible();
  await expect(page.getByText("0 credits")).toBeVisible();
  await expect(page.getByRole("button", { name: "Manage credits" })).toBeVisible();
});

test("/dashboard/match can select CV and submit JD", async ({ page }) => {
  await mockAuthenticatedPage(page);
  await mockCvs(page, cvList);
  await mockJobTargets(page, []);
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
  await expect(page.getByText("TypeScript", { exact: true })).toBeVisible();
  await expect(page.getByText("Redis", { exact: true })).toBeVisible();
  await expect(page.getByText("Add Redis project examples")).toBeVisible();
});

test("/dashboard/match can reuse a saved job target", async ({ page }) => {
  await mockAuthenticatedPage(page);
  await mockCvs(page, cvList);
  await mockJobTargets(page, jobTargets);
  await page.route("**://*/cvs/*/match", async (route) => {
    const request = route.request();
    expect(request.method()).toBe("POST");
    expect(request.postDataJSON()).toEqual({
      jobDescriptionText: jobTargets[0].jobDescriptionText,
    });

    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ data: matchAnalysis, meta: {} }),
    });
  });

  await page.goto("/dashboard/match");
  await page.getByLabel("Saved target").selectOption(jobTargets[0].id);
  await expect(page.getByLabel("Job description")).toHaveValue(
    jobTargets[0].jobDescriptionText,
  );
  await page.getByRole("button", { name: "Run match" }).click();

  await expect(
    page.getByRole("region", { name: "JD match result for Backend CV" }),
  ).toBeVisible();
});

test("/dashboard/match empty JD validation works", async ({ page }) => {
  await mockAuthenticatedPage(page);
  await mockCvs(page, cvList);
  await mockJobTargets(page, []);

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
  await mockJobTargets(page, []);
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

test("/dashboard/match insufficient credits displays clear message", async ({
  page,
}) => {
  await mockAuthenticatedPage(page, 0);
  await mockCvs(page, cvList);
  await mockJobTargets(page, []);
  await page.route("**://*/cvs/*/match", async (route) => {
    await route.fulfill({
      status: 402,
      contentType: "application/json",
      body: JSON.stringify(insufficientCreditsError),
    });
  });

  await page.goto("/dashboard/match");
  await page.getByLabel("Job description").fill("We need TypeScript.");
  await page.getByRole("button", { name: "Run match" }).click();

  await expect(
    page.getByRole("alert").filter({ hasText: "You’re out of credits." }),
  ).toBeVisible();
});

test("/dashboard/cover-letter can generate cover letter", async ({ page }) => {
  await mockAuthenticatedPage(page);
  await mockCvs(page, cvList);
  await mockJobTargets(page, []);
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

test("/dashboard/cover-letter can reuse a saved job target", async ({ page }) => {
  await mockAuthenticatedPage(page);
  await mockCvs(page, cvList);
  await mockJobTargets(page, jobTargets);
  await page.route("**://*/cvs/*/cover-letter", async (route) => {
    const request = route.request();
    expect(request.method()).toBe("POST");
    expect(request.postDataJSON()).toEqual({
      jobDescriptionText: jobTargets[0].jobDescriptionText,
      companyName: jobTargets[0].companyName,
      roleTitle: jobTargets[0].title,
      tone: "professional",
    });

    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ data: coverLetterAnalysis, meta: {} }),
    });
  });

  await page.goto("/dashboard/cover-letter");
  await page.getByLabel("Saved target").selectOption(jobTargets[0].id);
  await expect(page.getByLabel("Company name")).toHaveValue("Acme");
  await expect(page.getByLabel("Role title")).toHaveValue("Backend Engineer");
  await expect(page.getByLabel("Job description")).toHaveValue(
    jobTargets[0].jobDescriptionText,
  );
  await page.getByRole("button", { name: "Generate", exact: true }).click();

  await expect(
    page.getByRole("region", { name: "Cover letter result for Backend CV" }),
  ).toBeVisible();
});

test("/dashboard/cover-letter empty JD validation works", async ({ page }) => {
  await mockAuthenticatedPage(page);
  await mockCvs(page, cvList);
  await mockJobTargets(page, []);

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
  await mockJobTargets(page, []);
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

test("/dashboard/cover-letter insufficient credits displays clear message", async ({
  page,
}) => {
  await mockAuthenticatedPage(page, 0);
  await mockCvs(page, cvList);
  await mockJobTargets(page, []);
  await page.route("**://*/cvs/*/cover-letter", async (route) => {
    await route.fulfill({
      status: 402,
      contentType: "application/json",
      body: JSON.stringify(insufficientCreditsError),
    });
  });

  await page.goto("/dashboard/cover-letter");
  await page.getByLabel("Job description").fill("Build APIs with TypeScript.");
  await page.getByRole("button", { name: "Generate", exact: true }).click();

  await expect(
    page.getByRole("alert").filter({ hasText: "You’re out of credits." }),
  ).toBeVisible();
});

test("/dashboard/interview-prep can generate interview practice", async ({
  page,
}) => {
  await mockAuthenticatedPage(page);
  await mockCvs(page, cvList);
  await mockJobTargets(page, []);
  await page.route("**://*/cvs/*/interview-prep", async (route) => {
    const request = route.request();
    expect(request.method()).toBe("POST");
    expect(request.headers().authorization).toBe("Bearer valid-token");
    expect(request.url()).toContain(`/cvs/${cvList[0].id}/interview-prep`);
    expect(request.postDataJSON()).toEqual({
      interviewFocus: "technical",
      jobDescriptionText:
        "Build APIs with TypeScript, NestJS, and PostgreSQL.",
    });

    await new Promise((resolve) => setTimeout(resolve, 100));
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ data: interviewPrepAnalysis, meta: {} }),
    });
  });

  await page.goto("/dashboard/interview-prep");
  await page.getByLabel("CV").selectOption(cvList[0].id);
  await page.getByLabel("Interview focus").selectOption("technical");
  await page
    .getByLabel("Role context")
    .fill("Build APIs with TypeScript, NestJS, and PostgreSQL.");
  await page.getByRole("button", { name: "Generate prep" }).click();

  await expect(
    page.getByRole("button", { name: "Generating..." }),
  ).toBeDisabled();
  await expect(
    page.getByRole("region", { name: "Interview prep result for Backend CV" }),
  ).toBeVisible();
  await expect(
    page.getByText("Tell me about a TypeScript API you improved."),
  ).toBeVisible();
  await expect(page.getByText("Why it matters").first()).toBeVisible();
  await expect(page.getByText("Answer direction").first()).toBeVisible();
  await expect(page.getByText("STAR structure").first()).toBeVisible();
  await expect(page.getByText("Prepare Redis bridge answers")).toBeVisible();
});

test("/dashboard/interview-prep can reuse a saved job target", async ({
  page,
}) => {
  await mockAuthenticatedPage(page);
  await mockCvs(page, cvList);
  await mockJobTargets(page, jobTargets);
  await page.route("**://*/cvs/*/interview-prep", async (route) => {
    const request = route.request();
    expect(request.method()).toBe("POST");
    expect(request.postDataJSON()).toEqual({
      interviewFocus: "mixed",
      jobTargetId: jobTargets[0].id,
      jobDescriptionText: jobTargets[0].jobDescriptionText,
    });

    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ data: interviewPrepAnalysis, meta: {} }),
    });
  });

  await page.goto("/dashboard/interview-prep");
  await page.getByLabel("Saved target").selectOption(jobTargets[0].id);
  await expect(page.getByLabel("Role context")).toHaveValue(
    jobTargets[0].jobDescriptionText,
  );
  await page.getByRole("button", { name: "Generate prep" }).click();

  await expect(
    page.getByRole("region", { name: "Interview prep result for Backend CV" }),
  ).toBeVisible();
});

test("/dashboard/interview-prep handles empty CV library", async ({ page }) => {
  await mockAuthenticatedPage(page);
  await mockCvs(page, []);
  await mockJobTargets(page, []);

  await page.goto("/dashboard/interview-prep");

  await expect(page.getByRole("button", { name: "Generate prep" })).toBeDisabled();
  await expect(page.getByText("No CV selected")).toBeVisible();
});

test("/dashboard/interview-prep API error displays error", async ({ page }) => {
  await mockAuthenticatedPage(page);
  await mockCvs(page, cvList);
  await mockJobTargets(page, []);
  await page.route("**://*/cvs/*/interview-prep", async (route) => {
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

  await page.goto("/dashboard/interview-prep");
  await page.getByRole("button", { name: "Generate prep" }).click();

  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "CV text has not been extracted" }),
  ).toBeVisible();
});

test("/dashboard/interview-prep insufficient credits displays clear message", async ({
  page,
}) => {
  await mockAuthenticatedPage(page, 0);
  await mockCvs(page, cvList);
  await mockJobTargets(page, []);
  await page.route("**://*/cvs/*/interview-prep", async (route) => {
    await route.fulfill({
      status: 402,
      contentType: "application/json",
      body: JSON.stringify(insufficientCreditsError),
    });
  });

  await page.goto("/dashboard/interview-prep");
  await page.getByRole("button", { name: "Generate prep" }).click();

  await expect(
    page.getByRole("alert").filter({ hasText: "You’re out of credits." }),
  ).toBeVisible();
});

test("/dashboard/rewrite can select CV and displays rewrite suggestions", async ({
  page,
}) => {
  await mockAuthenticatedPage(page);
  await mockCvs(page, cvList);
  await page.route("**://*/cvs/*/rewrite", async (route) => {
    const request = route.request();
    expect(request.method()).toBe("POST");
    expect(request.headers().authorization).toBe("Bearer valid-token");
    expect(request.url()).toContain(`/cvs/${cvList[0].id}/rewrite`);
    expect(request.postDataJSON()).toEqual({
      originalText: cvList[0].extractedText,
      rewriteGoal: "stronger-impact",
    });

    await new Promise((resolve) => setTimeout(resolve, 100));
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ data: rewriteAnalysis, meta: {} }),
    });
  });

  await page.goto("/dashboard/rewrite");
  await page.getByLabel("CV").selectOption(cvList[0].id);
  await page.getByRole("button", { name: "Rewrite resume" }).click();

  await expect(
    page.getByRole("button", { name: "Rewriting..." }),
  ).toBeDisabled();
  await expect(
    page.getByRole("region", { name: "Resume rewrite result for Backend CV" }),
  ).toBeVisible();
  await expect(
    page.getByText("Worked on backend APIs for customer workflows."),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Delivered customer workflow APIs that reduced manual review time by 35%.",
    ),
  ).toBeVisible();
  await expect(
    page.getByText(
      "The revised bullet uses an action verb and adds measurable business impact.",
    ),
  ).toBeVisible();
});

test("/dashboard/rewrite can refine one suggestion", async ({ page }) => {
  await mockAuthenticatedPage(page);
  await mockCvs(page, cvList);
  await page.route("**://*/cvs/*/rewrite", async (route) => {
    if (route.request().url().endsWith("/rewrite/refine")) {
      await route.fallback();
      return;
    }

    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ data: rewriteAnalysis, meta: {} }),
    });
  });
  await page.route("**://*/cvs/*/rewrite/refine", async (route) => {
    const request = route.request();
    expect(request.method()).toBe("POST");
    expect(request.headers().authorization).toBe("Bearer valid-token");
    expect(request.postDataJSON()).toEqual({
      original: "Worked on backend APIs for customer workflows.",
      currentRewrite:
        "Delivered customer workflow APIs that reduced manual review time by 35%.",
      instruction: "more-technical",
    });

    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ data: rewriteRefinementAnalysis, meta: {} }),
    });
  });

  await page.goto("/dashboard/rewrite");
  await page.getByLabel("CV").selectOption(cvList[0].id);
  await page.getByRole("button", { name: "Rewrite resume" }).click();
  await page.getByRole("button", { name: "More technical" }).click();

  await expect(
    page.getByText(
      "Owned customer workflow API delivery with TypeScript, reducing manual review time by 35%.",
    ),
  ).toBeVisible();
  await expect(
    page.getByText("Worked on backend APIs for customer workflows."),
  ).toBeVisible();
  await expect(
    page.getByText(
      "The refined rewrite adds technical detail while preserving the measurable result.",
    ),
  ).toBeVisible();
});

test("/dashboard/rewrite shows per-card loading during refinement", async ({
  page,
}) => {
  await mockAuthenticatedPage(page);
  await mockCvs(page, cvList);
  await page.route("**://*/cvs/*/rewrite", async (route) => {
    if (route.request().url().endsWith("/rewrite/refine")) {
      await route.fallback();
      return;
    }

    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ data: rewriteAnalysis, meta: {} }),
    });
  });
  await page.route("**://*/cvs/*/rewrite/refine", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 150));
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ data: rewriteRefinementAnalysis, meta: {} }),
    });
  });

  await page.goto("/dashboard/rewrite");
  await page.getByLabel("CV").selectOption(cvList[0].id);
  await page.getByRole("button", { name: "Rewrite resume" }).click();
  await page.getByRole("button", { name: "Stronger" }).click();

  await expect(page.getByText("Updating this suggestion")).toBeVisible();
  await expect(page.getByRole("button", { name: "Stronger" })).toBeDisabled();
});

test("/dashboard/rewrite refinement API error displays per-card error", async ({
  page,
}) => {
  await mockAuthenticatedPage(page);
  await mockCvs(page, cvList);
  await page.route("**://*/cvs/*/rewrite", async (route) => {
    if (route.request().url().endsWith("/rewrite/refine")) {
      await route.fallback();
      return;
    }

    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ data: rewriteAnalysis, meta: {} }),
    });
  });
  await page.route("**://*/cvs/*/rewrite/refine", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        error: {
          code: "AI_PROVIDER_ERROR",
          message: "AI provider failed to return valid structured output",
        },
        meta: {},
      }),
    });
  });

  await page.goto("/dashboard/rewrite");
  await page.getByLabel("CV").selectOption(cvList[0].id);
  await page.getByRole("button", { name: "Rewrite resume" }).click();
  await page.getByRole("button", { name: "ATS-friendly" }).click();

  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "AI provider failed to return valid structured output" }),
  ).toBeVisible();
});

test("/dashboard/rewrite refinement insufficient credits displays clear message", async ({
  page,
}) => {
  await mockAuthenticatedPage(page, 0);
  await mockCvs(page, cvList);
  await page.route("**://*/cvs/*/rewrite", async (route) => {
    if (route.request().url().endsWith("/rewrite/refine")) {
      await route.fallback();
      return;
    }

    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ data: rewriteAnalysis, meta: {} }),
    });
  });
  await page.route("**://*/cvs/*/rewrite/refine", async (route) => {
    await route.fulfill({
      status: 402,
      contentType: "application/json",
      body: JSON.stringify(insufficientCreditsError),
    });
  });

  await page.goto("/dashboard/rewrite");
  await page.getByLabel("CV").selectOption(cvList[0].id);
  await page.getByRole("button", { name: "Rewrite resume" }).click();
  await page.getByRole("button", { name: "ATS-friendly" }).click();

  await expect(
    page.getByRole("alert").filter({ hasText: "You’re out of credits." }),
  ).toBeVisible();
});

test("/dashboard/rewrite missing CV selection shows error", async ({ page }) => {
  await mockAuthenticatedPage(page);
  await mockCvs(page, cvList);

  await page.goto("/dashboard/rewrite");
  await page.getByRole("button", { name: "Rewrite resume" }).click();

  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Select a CV before rewriting." }),
  ).toBeVisible();
});

test("/dashboard/rewrite API error displays error", async ({ page }) => {
  await mockAuthenticatedPage(page);
  await mockCvs(page, cvList);
  await page.route("**://*/cvs/*/rewrite", async (route) => {
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

  await page.goto("/dashboard/rewrite");
  await page.getByLabel("CV").selectOption(cvList[0].id);
  await page.getByRole("button", { name: "Rewrite resume" }).click();

  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "CV text has not been extracted" }),
  ).toBeVisible();
});

test("/dashboard/rewrite insufficient credits displays clear message", async ({
  page,
}) => {
  await mockAuthenticatedPage(page, 0);
  await mockCvs(page, cvList);
  await page.route("**://*/cvs/*/rewrite", async (route) => {
    await route.fulfill({
      status: 402,
      contentType: "application/json",
      body: JSON.stringify(insufficientCreditsError),
    });
  });

  await page.goto("/dashboard/rewrite");
  await page.getByLabel("CV").selectOption(cvList[0].id);
  await page.getByRole("button", { name: "Rewrite resume" }).click();

  await expect(
    page.getByRole("alert").filter({ hasText: "You’re out of credits." }),
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
        data: [
          cvAnalysis,
          legacyCvAnalysis,
          matchAnalysis,
          coverLetterAnalysis,
          rewriteAnalysis,
          rewriteRefinementAnalysis,
          interviewPrepAnalysis,
        ],
        meta: {},
      }),
    });
  });

  await page.goto("/dashboard/history");

  const history = page.getByRole("region", { name: "Analysis history" });
  await expect(history.getByText("Backend CV").first()).toBeVisible();
  await expect(history.getByText("Score: 82")).toBeVisible();
  await expect(history.getByText("Scorecard")).toBeVisible();
  await expect(history.getByText("ATS")).toBeVisible();
  await expect(history.getByText("Actionable insights")).toBeVisible();
  await expect(history.getByText("Add delivery metrics to backend work")).toBeVisible();
  await expect(history.getByText("Score: 68")).toBeVisible();
  await expect(history.getByText("Concise summary")).toBeVisible();
  await expect(history.getByText("Matching score: 75")).toBeVisible();
  await expect(
    history.getByText("I am excited to apply for the Backend Engineer role."),
  ).toBeVisible();
  await expect(history.getByText("Rewrite goal: Stronger Impact")).toBeVisible();
  await expect(
    history.getByText("Worked on backend APIs for customer workflows."),
  ).toBeVisible();
  await expect(
    history.getByText(
      "Delivered customer workflow APIs that reduced manual review time by 35%.",
    ),
  ).toBeVisible();
  await expect(
    history.getByText(
      "The revised bullet uses an action verb and adds measurable business impact.",
    ),
  ).toBeVisible();
  await expect(
    history.getByText("Rewrite refinement", { exact: true }),
  ).toBeVisible();
  await expect(
    history.getByText(
      "Owned customer workflow API delivery with TypeScript, reducing manual review time by 35%.",
    ),
  ).toBeVisible();
  await expect(
    history.getByText(
      "The refined rewrite adds technical detail while preserving the measurable result.",
    ),
  ).toBeVisible();
  await expect(history.getByText("Interview prep", { exact: true })).toBeVisible();
  await expect(
    history.getByText("Tell me about a TypeScript API you improved."),
  ).toBeVisible();
  await expect(history.getByText("Prepare Redis bridge answers")).toBeVisible();
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

test("/dashboard/progress shows resume quality trends", async ({ page }) => {
  await mockAuthenticatedPage(page);
  await mockCvs(page, cvList);
  await page.route("**://*/cvs/*/progress", async (route) => {
    const request = route.request();
    expect(request.method()).toBe("GET");
    expect(request.headers().authorization).toBe("Bearer valid-token");
    expect(request.url()).toContain(`/cvs/${cvList[0].id}/progress`);

    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ data: cvProgress, meta: {} }),
    });
  });

  await page.goto("/dashboard/progress");

  await expect(
    page.getByRole("heading", { name: "Progress", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Latest score")).toBeVisible();
  await expect(page.getByText("+14")).toBeVisible();
  await expect(page.getByText("ATS readiness improved +12")).toBeVisible();
  await expect(page.getByText("3 rewrites generated this week")).toBeVisible();
  await expect(page.getByText("Keyword optimization improved +12")).toBeVisible();
  await expect(page.getByText("Score trend")).toBeVisible();
  await expect(page.getByLabel("Score 82")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Rewrite activity" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Category movement" }),
  ).toBeVisible();
});

test("/dashboard/progress handles empty CV library", async ({ page }) => {
  await mockAuthenticatedPage(page);
  await mockCvs(page, []);

  await page.goto("/dashboard/progress");

  await expect(
    page.getByText("Upload a CV and run an analysis to start tracking progress."),
  ).toBeVisible();
});

async function mockAuthenticatedPage(
  page: import("@playwright/test").Page,
  creditBalance = 24,
) {
  await mockAuthMe(page, creditBalance);
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

async function mockJobTargets(
  page: import("@playwright/test").Page,
  data: typeof jobTargets,
) {
  await page.route("**://*/job-targets", async (route) => {
    const request = route.request();
    expect(request.method()).toBe("GET");
    expect(request.headers().authorization).toBe("Bearer valid-token");

    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ data, meta: {} }),
    });
  });
}

async function mockAuthMe(
  page: import("@playwright/test").Page,
  creditBalance = 24,
) {
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
          creditBalance,
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
