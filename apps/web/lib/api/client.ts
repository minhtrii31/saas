import type { ApiError, ApiErrorEnvelope, ApiMeta, ApiSuccessEnvelope } from "./types";

type RequestBody = BodyInit | Record<string, unknown> | unknown[] | null;

export type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: RequestBody;
};

export type ApiClientOptions = {
  baseUrl?: string;
  fetcher?: typeof fetch;
};

export class ApiClientError<Meta extends ApiMeta = ApiMeta> extends Error {
  readonly status: number;
  readonly error: ApiError;
  readonly meta: Meta;

  constructor(status: number, envelope: ApiErrorEnvelope<Meta>) {
    super(envelope.error.message);
    this.name = "ApiClientError";
    this.status = status;
    this.error = envelope.error;
    this.meta = envelope.meta;
  }
}

export function createApiClient(options: ApiClientOptions = {}) {
  const fetcher = options.fetcher ?? fetch;

  return {
    request<Data, Meta extends ApiMeta = ApiMeta>(
      path: string,
      requestOptions: ApiRequestOptions = {},
    ): Promise<ApiSuccessEnvelope<Data, Meta>> {
      const baseUrl = normalizeBaseUrl(
        options.baseUrl ?? process.env.NEXT_PUBLIC_API_URL,
      );

      return request<Data, Meta>(fetcher, baseUrl, path, requestOptions);
    },
  };
}

export const apiClient: ReturnType<typeof createApiClient> = {
  request(path, requestOptions) {
    return createApiClient().request(path, requestOptions);
  },
};

async function request<Data, Meta extends ApiMeta>(
  fetcher: typeof fetch,
  baseUrl: string,
  path: string,
  options: ApiRequestOptions,
): Promise<ApiSuccessEnvelope<Data, Meta>> {
  const response = await fetcher(buildUrl(baseUrl, path), {
    ...options,
    headers: buildHeaders(options.headers, options.body),
    body: serializeBody(options.body),
  });
  const envelope = await parseEnvelope<Data, Meta>(response);

  if ("error" in envelope) {
    throw new ApiClientError(response.status, envelope);
  }

  return envelope;
}

function normalizeBaseUrl(baseUrl: string | undefined) {
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is required to use the API client.");
  }

  return baseUrl.replace(/\/+$/, "");
}

function buildUrl(baseUrl: string, path: string) {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  return `${baseUrl}/${path.replace(/^\/+/, "")}`;
}

function buildHeaders(headers: HeadersInit | undefined, body: RequestBody | undefined) {
  const nextHeaders = new Headers(headers);

  if (body !== undefined && shouldSerializeJson(body) && !nextHeaders.has("Content-Type")) {
    nextHeaders.set("Content-Type", "application/json");
  }

  if (!nextHeaders.has("Accept")) {
    nextHeaders.set("Accept", "application/json");
  }

  return nextHeaders;
}

function serializeBody(body: RequestBody | undefined) {
  if (body === undefined || body === null || !shouldSerializeJson(body)) {
    return body;
  }

  return JSON.stringify(body);
}

function shouldSerializeJson(body: RequestBody): body is Record<string, unknown> | unknown[] {
  return (
    typeof body === "object" &&
    body !== null &&
    !(body instanceof FormData) &&
    !(body instanceof Blob) &&
    !(body instanceof ArrayBuffer) &&
    !(body instanceof URLSearchParams)
  );
}

async function parseEnvelope<Data, Meta extends ApiMeta>(
  response: Response,
): Promise<ApiSuccessEnvelope<Data, Meta> | ApiErrorEnvelope<Meta>> {
  const contentType = response.headers.get("Content-Type") ?? "";

  if (!contentType.includes("application/json")) {
    return {
      error: {
        code: "NON_JSON_RESPONSE",
        message: "The API returned a non-JSON response.",
      },
      meta: {} as Meta,
    };
  }

  const envelope = (await response.json()) as
    | ApiSuccessEnvelope<Data, Meta>
    | ApiErrorEnvelope<Meta>;

  if (response.ok && "data" in envelope && "meta" in envelope) {
    return envelope;
  }

  if ("error" in envelope && "meta" in envelope) {
    return envelope;
  }

  return {
    error: {
      code: "INVALID_API_ENVELOPE",
      message: "The API response did not match the expected envelope.",
    },
    meta: {} as Meta,
  };
}
