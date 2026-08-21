export type WorkspacePanel = "chat" | "spec" | "deck" | "results" | "comparison";
export type JobStatus = "idle" | "queued" | "running" | "completed" | "failed" | "cancelled";
export interface JobView { jobId: string | null; status: JobStatus; progress: number; message: string }
export interface WorkspaceState {
  activePanel: WorkspacePanel;
  request: string;
  spec: Record<string, unknown> | null;
  deckVersionIds: string[];
  selectedVersionId: string | null;
  comparisonVersionIds: [string, string] | null;
  job: JobView;
}
export type WorkspaceAction =
  | { type: "navigate"; panel: WorkspacePanel }
  | { type: "request_changed"; request: string }
  | { type: "spec_loaded"; spec: Record<string, unknown> }
  | { type: "job_started"; jobId: string }
  | { type: "job_progress"; jobId: string; progress: number; message: string }
  | { type: "job_finished"; jobId: string; versionId: string }
  | { type: "job_failed"; jobId: string; message: string }
  | { type: "job_cancelled"; jobId: string }
  | { type: "compare"; leftVersionId: string; rightVersionId: string };

export const initialWorkspaceState: WorkspaceState = {
  activePanel: "chat", request: "", spec: null, deckVersionIds: [],
  selectedVersionId: null, comparisonVersionIds: null,
  job: { jobId: null, status: "idle", progress: 0, message: "" },
};

export function reduceWorkspace(state: WorkspaceState, action: WorkspaceAction): WorkspaceState {
  if ("jobId" in action && state.job.jobId !== null && action.type !== "job_started" && action.jobId !== state.job.jobId) return state;
  switch (action.type) {
    case "navigate": return { ...state, activePanel: action.panel };
    case "request_changed": return { ...state, request: action.request };
    case "spec_loaded": return { ...state, spec: structuredClone(action.spec), activePanel: "spec" };
    case "job_started": return { ...state, job: { jobId: action.jobId, status: "running", progress: 0, message: "Starting build" } };
    case "job_progress": return { ...state, job: { ...state.job, progress: clamp(action.progress), message: action.message } };
    case "job_finished": return { ...state, deckVersionIds: [...state.deckVersionIds, action.versionId], selectedVersionId: action.versionId, activePanel: "results", job: { ...state.job, status: "completed", progress: 1, message: "Build complete" } };
    case "job_failed": return { ...state, job: { ...state.job, status: "failed", message: action.message } };
    case "job_cancelled": return { ...state, job: { ...state.job, status: "cancelled", message: "Cancelled" } };
    case "compare": return { ...state, comparisonVersionIds: [action.leftVersionId, action.rightVersionId], activePanel: "comparison" };
  }
}
function clamp(value: number): number { return Math.max(0, Math.min(1, value)); }

export interface CancellableJobPort {
  start(request: string, signal: AbortSignal, onProgress: (progress: number, message: string) => void): Promise<string>;
}
export class JobController {
  private active: AbortController | null = null;
  constructor(private readonly port: CancellableJobPort) {}
  async start(request: string, onProgress: (progress: number, message: string) => void): Promise<string> {
    this.cancel();
    this.active = new AbortController();
    try { return await this.port.start(request, this.active.signal, onProgress); }
    finally { this.active = null; }
  }
  cancel(): void { this.active?.abort(); this.active = null; }
}
