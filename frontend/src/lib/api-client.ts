// Funções fetch tipadas para a API Fastify. Componentes de UI não devem
// chamar `fetch` diretamente — sempre passar por aqui (ver frontend/CLAUDE.md).

import type {
  Days,
  KpisResponse,
  ListAlertsResponse,
  ListAnalysesResponse,
  ParamKey,
  Parameter,
  PreviewComplianceBody,
  PreviewComplianceResponse,
  SeriesResponse,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

// O plano gratuito do Render "dorme" a API após inatividade e pode levar
// dezenas de segundos para responder à primeira requisição — 20s cobre esse
// cold start sem travar a UI indefinidamente em caso de falha real de rede.
const REQUEST_TIMEOUT_MS = 20_000;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_URL) {
    throw new ApiError(
      "NEXT_PUBLIC_API_URL não configurada (ver .env.example).",
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError(`Tempo limite excedido ao chamar ${path}.`);
    }
    throw new ApiError(`Falha de rede ao chamar ${path}.`);
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new ApiError(`Erro ${response.status} ao chamar ${path}.`, response.status);
  }

  return response.json() as Promise<T>;
}

function daysQuery(days: Days): string {
  return `days=${days}`;
}

export function getParameters(): Promise<Parameter[]> {
  return request<Parameter[]>("/parameters");
}

export function getAnalyses(days: Days): Promise<ListAnalysesResponse> {
  return request<ListAnalysesResponse>(`/analyses?${daysQuery(days)}`);
}

export function getSeries(param: ParamKey, days: Days): Promise<SeriesResponse> {
  return request<SeriesResponse>(`/series?param=${param}&${daysQuery(days)}`);
}

export function getKpis(days: Days): Promise<KpisResponse> {
  return request<KpisResponse>(`/kpis?${daysQuery(days)}`);
}

export function getAlerts(days: Days): Promise<ListAlertsResponse> {
  return request<ListAlertsResponse>(`/alerts?${daysQuery(days)}`);
}

export function postCompliancePreview(
  body: PreviewComplianceBody,
): Promise<PreviewComplianceResponse> {
  return request<PreviewComplianceResponse>("/compliance/preview", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
