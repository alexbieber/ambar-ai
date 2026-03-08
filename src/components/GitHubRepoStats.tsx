import { useState, useEffect } from 'react';

const GITHUB_REPO = 'alexbieber/ambar-ai';
const GITHUB_API = `https://api.github.com/repos/${GITHUB_REPO}`;
const GITHUB_URL = `https://github.com/${GITHUB_REPO}`;
// Visitor count badge (visitorbadge.io): /api/visitors, link to status page
const VISITORS_BADGE_URL =
  'https://api.visitorbadge.io/api/visitors?path=alexbieber%2Fambar-ai&labelColor=%23555555&countColor=%236366f1';
const VISITORS_STATUS_URL = 'https://visitorbadge.io/status?path=alexbieber/ambar-ai';

interface RepoStats {
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  open_issues_count?: number;
}

const CACHE_KEY = `github_stats_${GITHUB_REPO.replace('/', '_')}`;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min

function getCached(): RepoStats | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, at } = JSON.parse(raw);
    if (Date.now() - at > CACHE_TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
}

function setCached(data: RepoStats) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, at: Date.now() }));
  } catch {
    // ignore
  }
}

export function GitHubRepoStats() {
  const [stats, setStats] = useState<RepoStats | null>(getCached());
  const [loading, setLoading] = useState(!getCached());
  const [error, setError] = useState(false);

  useEffect(() => {
    const cached = getCached();
    if (cached) {
      setStats(cached);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetch(GITHUB_API, { headers: { Accept: 'application/vnd.github.v3+json' } })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.statusText))))
      .then((data: RepoStats) => {
        if (!cancelled) {
          setStats(data);
          setCached(data);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading && !stats) return null;
  if (error && !stats) return null;

  return (
    <div className="flex items-center gap-2">
      <a
        href={GITHUB_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-2 py-1.5 rounded text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--faint)] transition-colors text-xs"
        title={`GitHub: ${GITHUB_REPO}`}
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
        </svg>
        {stats && (
          <>
            <span className="font-medium text-[var(--text)]">{stats.stargazers_count}</span>
            <span aria-hidden>·</span>
            <span>{stats.forks_count} forks</span>
          </>
        )}
      </a>
      <a
        href={VISITORS_STATUS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center min-w-0"
        title="Visitors (page views)"
      >
        <img
          src={VISITORS_BADGE_URL}
          alt="Visitors"
          className="h-5 min-w-[60px]"
        />
      </a>
    </div>
  );
}
