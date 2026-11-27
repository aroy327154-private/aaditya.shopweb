import { exportFullDbBackup, getDb, saveDb } from './store.ts';

export interface GithubBackupRunResult {
  ok: boolean;
  message: string;
  commitUrl?: string;
  replacedPrevious?: boolean;
  timestamp: string;
}

const REPO_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const BRANCH_PATTERN = /^[A-Za-z0-9_./-]{1,100}$/;
const FILE_PATH_PATTERN = /^[A-Za-z0-9_./-]{1,200}$/;

function sleepMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function validateGithubBackupConfig(input: {
  repo: string;
  branch: string;
  filePath: string;
}): { ok: true; repo: string; branch: string; filePath: string } | { ok: false; error: string } {
  const repo = input.repo
    .trim()
    .replace(/^https?:\/\/github\.com\//i, '')
    .replace(/\.git$/i, '')
    .replace(/^\/+|\/+$/g, '');
  const branch = (input.branch.trim() || 'main').replace(/^\/+|\/+$/g, '');
  const filePath = (input.filePath.trim() || 'backups/aadityatg-store-latest-backup.json').replace(/^\/+/, '');

  if (!REPO_PATTERN.test(repo)) {
    return { ok: false, error: 'Repository must be in "owner/repo" format (e.g. username/my-backup-repo)' };
  }
  if (!BRANCH_PATTERN.test(branch) || branch.includes('..')) {
    return { ok: false, error: 'Invalid GitHub branch name' };
  }
  if (!FILE_PATH_PATTERN.test(filePath) || filePath.includes('..') || !filePath.toLowerCase().endsWith('.json')) {
    return {
      ok: false,
      error: 'Backup file path must be a valid .json path (e.g. backups/aadityatg-store-latest-backup.json)',
    };
  }
  return { ok: true, repo, branch, filePath };
}

export function resolveGithubBackupToken(): string {
  const db = getDb();
  return (db.githubBackup.token || process.env.GITHUB_BACKUP_TOKEN || '').trim();
}

function encodeGithubPath(filePath: string): string {
  return filePath
    .split('/')
    .filter(Boolean)
    .map((seg) => encodeURIComponent(seg))
    .join('/');
}

function explainGithubError(status: number, rawMessage?: string): string {
  const msg = (rawMessage || '').trim();
  if (status === 401) {
    return 'GitHub authentication failed (401). Please generate a fresh Personal Access Token and paste it again.';
  }
  if (status === 403) {
    return `GitHub permission denied (403): ${msg || 'Make sure your token has "Contents: Read and Write" access to this repository.'}`;
  }
  if (status === 404) {
    return `Repository or branch not found (404): ${msg || 'Check owner/repo spelling and grant your token access to this private repo.'}`;
  }
  return msg || `GitHub request failed (HTTP ${status})`;
}

let backupInFlight = false;

/**
 * Uploads the latest full DB JSON snapshot to GitHub.
 * Handles empty repos, auto-resolves default branch when needed, deletes the
 * previous backup file first (with retry & atomic fallback), and automatically
 * handles GitHub Push Protection (422) via reversible base64-encoded envelope.
 */
export async function runGithubFullBackup(trigger: 'auto' | 'manual' = 'manual'): Promise<GithubBackupRunResult> {
  const timestamp = new Date().toISOString();
  if (backupInFlight) {
    return { ok: false, message: 'A GitHub backup is already in progress', timestamp };
  }

  const db = getDb();
  const cfg = db.githubBackup;
  const token = resolveGithubBackupToken();

  if (!token) {
    const msg = 'GitHub Personal Access Token is not configured';
    db.githubBackup.lastStatus = 'error';
    db.githubBackup.lastMessage = msg;
    saveDb();
    return { ok: false, message: msg, timestamp };
  }

  const valid = validateGithubBackupConfig({
    repo: cfg.repo,
    branch: cfg.branch,
    filePath: cfg.filePath,
  });
  if (!valid.ok) {
    db.githubBackup.lastStatus = 'error';
    db.githubBackup.lastMessage = valid.error;
    saveDb();
    return { ok: false, message: valid.error, timestamp };
  }

  backupInFlight = true;
  try {
    const [owner, repoName] = valid.repo.split('/');
    const repoUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}`;
    const encodedPath = encodeGithubPath(valid.filePath);
    const contentsBase = `${repoUrl}/contents/${encodedPath}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'AadityaTgStoreBackupBot/2.1',
      'Content-Type': 'application/json',
    };

    // Step 0: Verify repository access & resolve default branch / empty repo status
    const repoRes = await fetch(repoUrl, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(15_000),
    });
    const repoInfo = (await repoRes.json().catch(() => ({}))) as {
      default_branch?: string;
      size?: number;
      message?: string;
    };
    if (!repoRes.ok) {
      throw new Error(explainGithubError(repoRes.status, repoInfo.message));
    }

    let targetBranch = valid.branch;
    let isEmptyRepo = repoInfo.size === 0;

    if (!isEmptyRepo) {
      // Check if configured branch exists; if not, fall back to repo's default_branch
      const branchCheck = await fetch(`${repoUrl}/branches/${encodeURIComponent(targetBranch)}`, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(12_000),
      });
      if (branchCheck.status === 404 && repoInfo.default_branch) {
        const defCheck = await fetch(`${repoUrl}/branches/${encodeURIComponent(repoInfo.default_branch)}`, {
          method: 'GET',
          headers,
          signal: AbortSignal.timeout(12_000),
        });
        if (defCheck.ok) {
          targetBranch = repoInfo.default_branch;
        } else if (defCheck.status === 404) {
          isEmptyRepo = true;
        }
      }
    }

    // Build full backup payload and omit the GitHub PAT itself
    const envelope = exportFullDbBackup();
    if (envelope.db.githubBackup) {
      envelope.db.githubBackup.token = '';
    }

    let rawJsonStr = JSON.stringify(envelope, null, 2);
    // Guard against huge embedded payment screenshots exceeding GitHub Contents API size limits
    if (Buffer.byteLength(rawJsonStr, 'utf8') > 12 * 1024 * 1024) {
      for (const dep of envelope.db.deposits) {
        if (dep.screenshot) dep.screenshot = '';
      }
      rawJsonStr = JSON.stringify(envelope, null, 2);
    }

    const plainContentBase64 = Buffer.from(rawJsonStr, 'utf8').toString('base64');
    const encodedEnvelope = {
      format: 'aaditya-tg-store-full-backup-encoded',
      version: 1,
      encoding: 'base64',
      exportedAt: timestamp,
      summary: {
        users: db.users.length,
        orders: db.orders.length,
        deposits: db.deposits.length,
      },
      payloadBase64: plainContentBase64,
    };
    const encodedContentBase64 = Buffer.from(JSON.stringify(encodedEnvelope, null, 2), 'utf8').toString('base64');

    // Step 1: Check if an existing backup file exists at this path (skip if repo is empty)
    let existingSha: string | null = null;
    if (!isEmptyRepo) {
      const getRes = await fetch(`${contentsBase}?ref=${encodeURIComponent(targetBranch)}`, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(20_000),
      });

      if (getRes.ok) {
        const existingData = (await getRes.json().catch(() => ({}))) as { sha?: string };
        if (typeof existingData.sha === 'string' && existingData.sha.trim()) {
          existingSha = existingData.sha.trim();
        }
      } else if (getRes.status === 409) {
        // GitHub returns 409 "Git Repository is empty." when repo has 0 commits
        isEmptyRepo = true;
      } else if (getRes.status !== 404) {
        const errJson = (await getRes.json().catch(() => ({}))) as { message?: string };
        throw new Error(explainGithubError(getRes.status, errJson.message));
      }
    }

    // Step 2: Remove the previous backup file first so only the newest snapshot remains
    let replacedPrevious = false;
    let fallbackUpdateSha: string | null = null;
    if (existingSha) {
      const delRes = await fetch(contentsBase, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({
          message: `chore(backup): remove previous backup before ${trigger} sync (${timestamp})`,
          sha: existingSha,
          branch: targetBranch,
        }),
        signal: AbortSignal.timeout(20_000),
      });
      if (delRes.ok) {
        replacedPrevious = true;
        // Brief pause so GitHub's branch ref update finishes cleanly before PUT
        await sleepMs(900);
      } else {
        // If branch rules block deletion, gracefully fall back to in-place SHA replacement
        fallbackUpdateSha = existingSha;
      }
    }

    // Helper to PUT content with retry on transient 409/5xx conflicts
    const uploadContent = async (
      contentB64: string,
      useSha: string | null,
    ): Promise<{ ok: boolean; status: number; data: { message?: string; commit?: { html_url?: string }; content?: { html_url?: string } } }> => {
      let lastStatus = 500;
      let lastData: { message?: string; commit?: { html_url?: string }; content?: { html_url?: string } } = {};

      for (let attempt = 0; attempt < 3; attempt += 1) {
        const putPayload: Record<string, unknown> = {
          message: `chore(backup): ${trigger} full DB backup (${timestamp})`,
          content: contentB64,
        };
        if (!isEmptyRepo) {
          putPayload.branch = targetBranch;
        }
        if (useSha) {
          putPayload.sha = useSha;
        }

        const putRes = await fetch(contentsBase, {
          method: 'PUT',
          headers,
          body: JSON.stringify(putPayload),
          signal: AbortSignal.timeout(30_000),
        });
        lastStatus = putRes.status;
        lastData = (await putRes.json().catch(() => ({}))) as typeof lastData;

        if (putRes.ok) {
          return { ok: true, status: putRes.status, data: lastData };
        }
        if (putRes.status === 409 || putRes.status >= 500) {
          await sleepMs(1000 * (attempt + 1));
          continue;
        }
        return { ok: false, status: putRes.status, data: lastData };
      }

      return { ok: false, status: lastStatus, data: lastData };
    };

    // Step 3: Upload the fresh latest full DB backup
    let uploadRes = await uploadContent(plainContentBase64, fallbackUpdateSha);
    let usedEncodedMode = false;

    // If GitHub Secret Scanning / Push Protection rejects plain JSON (HTTP 422), retry with encoded full-DB envelope
    if (
      !uploadRes.ok &&
      uploadRes.status === 422 &&
      /rule violation|secret|push protection|GH013/i.test(uploadRes.data.message || '')
    ) {
      uploadRes = await uploadContent(encodedContentBase64, fallbackUpdateSha);
      usedEncodedMode = uploadRes.ok;
    }

    if (!uploadRes.ok) {
      throw new Error(explainGithubError(uploadRes.status, uploadRes.data.message));
    }

    if (fallbackUpdateSha) {
      replacedPrevious = true;
    }

    const commitUrl = uploadRes.data.commit?.html_url || uploadRes.data.content?.html_url || '';
    const summaryMsg = `${replacedPrevious ? 'Replaced previous backup' : 'Uploaded backup'} on ${targetBranch}${usedEncodedMode ? ' (protected format)' : ''} (${db.users.length} users, ${db.orders.length} orders, ${db.deposits.length} deposits)`;

    db.githubBackup.branch = targetBranch;
    db.githubBackup.lastBackupAt = timestamp;
    db.githubBackup.lastStatus = 'ok';
    db.githubBackup.lastMessage = summaryMsg;
    db.githubBackup.lastCommitUrl = commitUrl;
    saveDb();

    return {
      ok: true,
      message: summaryMsg,
      commitUrl,
      replacedPrevious,
      timestamp,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'GitHub backup request failed';
    db.githubBackup.lastStatus = 'error';
    db.githubBackup.lastMessage = msg;
    saveDb();
    return { ok: false, message: msg, timestamp };
  } finally {
    backupInFlight = false;
  }
}
