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

export function validateGithubBackupConfig(input: {
  repo: string;
  branch: string;
  filePath: string;
}): { ok: true; repo: string; branch: string; filePath: string } | { ok: false; error: string } {
  const repo = input.repo.trim().replace(/^https?:\/\/github\.com\//i, '').replace(/\.git$/i, '').replace(/^\/+|\/+$/g, '');
  const branch = (input.branch.trim() || 'main').replace(/^\/+|\/+$/g, '');
  const filePath = (input.filePath.trim() || 'backups/aadityatg-store-latest-backup.json').replace(/^\/+/, '');

  if (!REPO_PATTERN.test(repo)) {
    return { ok: false, error: 'Repository must be in "owner/repo" format (e.g. username/my-backup-repo)' };
  }
  if (!BRANCH_PATTERN.test(branch) || branch.includes('..')) {
    return { ok: false, error: 'Invalid GitHub branch name' };
  }
  if (!FILE_PATH_PATTERN.test(filePath) || filePath.includes('..') || !filePath.toLowerCase().endsWith('.json')) {
    return { ok: false, error: 'Backup file path must be a valid .json path (e.g. backups/aadityatg-store-latest-backup.json)' };
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

let backupInFlight = false;

/**
 * Uploads the latest full DB JSON snapshot to GitHub.
 * Removes the previous backup file at the same path first (if present)
 * and uploads the fresh latest snapshot so only the newest backup remains.
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
    const encodedPath = encodeGithubPath(valid.filePath);
    const contentsBase = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}/contents/${encodedPath}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'AadityaTgStoreBackupBot/2.0',
      'Content-Type': 'application/json',
    };

    // Build full backup payload and omit the GitHub PAT itself so GitHub Push Protection never rejects the commit
    const envelope = exportFullDbBackup();
    if (envelope.db.githubBackup) {
      envelope.db.githubBackup.token = '';
    }
    const contentBase64 = Buffer.from(JSON.stringify(envelope, null, 2), 'utf8').toString('base64');

    // Step 1: Check if an existing backup file exists at this path
    let existingSha: string | null = null;
    const getRes = await fetch(`${contentsBase}?ref=${encodeURIComponent(valid.branch)}`, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(20_000),
    });

    if (getRes.ok) {
      const existingData = (await getRes.json().catch(() => ({}))) as { sha?: string };
      if (typeof existingData.sha === 'string' && existingData.sha.trim()) {
        existingSha = existingData.sha.trim();
      }
    } else if (getRes.status !== 404) {
      const errJson = (await getRes.json().catch(() => ({}))) as { message?: string };
      throw new Error(errJson.message || `GitHub lookup failed (HTTP ${getRes.status})`);
    }

    // Step 2: Remove the old backup file first so only the newest snapshot exists
    let replacedPrevious = false;
    if (existingSha) {
      const delRes = await fetch(contentsBase, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({
          message: `chore(backup): remove previous backup before ${trigger} sync (${timestamp})`,
          sha: existingSha,
          branch: valid.branch,
        }),
        signal: AbortSignal.timeout(20_000),
      });
      if (!delRes.ok) {
        const errJson = (await delRes.json().catch(() => ({}))) as { message?: string };
        throw new Error(errJson.message || `Failed to remove previous GitHub backup (HTTP ${delRes.status})`);
      }
      replacedPrevious = true;
    }

    // Step 3: Upload the fresh latest full DB backup
    const putPayload: Record<string, unknown> = {
      message: `chore(backup): ${trigger} full DB backup (${timestamp})`,
      content: contentBase64,
      branch: valid.branch,
    };

    const putRes = await fetch(contentsBase, {
      method: 'PUT',
      headers,
      body: JSON.stringify(putPayload),
      signal: AbortSignal.timeout(25_000),
    });

    const putData = (await putRes.json().catch(() => ({}))) as {
      message?: string;
      commit?: { html_url?: string };
      content?: { html_url?: string };
    };

    if (!putRes.ok) {
      throw new Error(putData.message || `GitHub backup upload failed (HTTP ${putRes.status})`);
    }

    const commitUrl = putData.commit?.html_url || putData.content?.html_url || '';
    const summaryMsg = `${replacedPrevious ? 'Replaced previous backup' : 'Uploaded backup'} (${db.users.length} users, ${db.orders.length} orders, ${db.deposits.length} deposits)`;

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
