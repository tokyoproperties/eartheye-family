import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, GitPullRequest, CheckCircle, XCircle, Clock, ExternalLink, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function PullRequests() {
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [inputOwner, setInputOwner] = useState('');
  const [inputRepo, setInputRepo] = useState('');
  const [prs, setPrs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);

  const fetchPRs = useCallback(async (o, r) => {
    if (!o || !r) return;
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('getPullRequests', { owner: o, repo: r });
      setPrs(res.data.pullRequests || []);
      setLastFetched(new Date());
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Failed to fetch pull requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (owner && repo) {
      fetchPRs(owner, repo);
    }
  }, [owner, repo, fetchPRs]);

  const handleSearch = (e) => {
    e.preventDefault();
    setOwner(inputOwner.trim());
    setRepo(inputRepo.trim());
  };

  const getReviewStatus = (pr) => {
    if (pr.changesRequested > 0) return { label: 'Changes Requested', color: 'bg-red-500/20 text-red-400 border-red-500/30' };
    if (pr.approvals > 0) return { label: `${pr.approvals} Approved`, color: 'bg-green-500/20 text-green-400 border-green-500/30' };
    return { label: 'Awaiting Review', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
  };

  const stats = {
    total: prs.length,
    approved: prs.filter((p) => p.approvals > 0 && p.changesRequested === 0).length,
    changesRequested: prs.filter((p) => p.changesRequested > 0).length,
    drafts: prs.filter((p) => p.draft).length,
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <GitPullRequest className="w-5 h-5 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Pull Request Tracker</h1>
          <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full">EarthEye OC</span>
        </div>
        <p className="text-slate-400 text-sm mb-8 ml-11">Monitor pending GitHub pull requests for dashboard updates</p>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-3 mb-8">
          <Input
            placeholder="owner / org"
            value={inputOwner}
            onChange={(e) => setInputOwner(e.target.value)}
            className="bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 max-w-48"
          />
          <span className="text-slate-600 self-center text-lg">/</span>
          <Input
            placeholder="repository"
            value={inputRepo}
            onChange={(e) => setInputRepo(e.target.value)}
            className="bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 max-w-64"
          />
          <Button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white gap-2">
            <Search className="w-4 h-4" /> Track
          </Button>
          {owner && repo && (
            <Button
              type="button"
              variant="outline"
              onClick={() => fetchPRs(owner, repo)}
              disabled={loading}
              className="border-slate-700 text-slate-300 hover:bg-slate-800 gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
        </form>

        {/* Stats */}
        {owner && repo && !loading && prs.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Open PRs', value: stats.total, icon: GitPullRequest, color: 'text-blue-400' },
              { label: 'Approved', value: stats.approved, icon: CheckCircle, color: 'text-green-400' },
              { label: 'Changes Needed', value: stats.changesRequested, icon: XCircle, color: 'text-red-400' },
              { label: 'Drafts', value: stats.drafts, icon: Clock, color: 'text-yellow-400' },
            ].map((s) => (
              <Card key={s.label} className="bg-slate-900 border-slate-800">
                <CardContent className="p-4 flex items-center gap-3">
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                  <div>
                    <p className="text-2xl font-bold text-slate-100">{s.value}</p>
                    <p className="text-xs text-slate-400">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-5 animate-pulse">
                <div className="h-4 bg-slate-800 rounded w-2/3 mb-3" />
                <div className="h-3 bg-slate-800 rounded w-1/3" />
              </div>
            ))}
          </div>
        )}

        {/* PR List */}
        {!loading && prs.length > 0 && (
          <div className="space-y-3">
            {prs.map((pr) => {
              const reviewStatus = getReviewStatus(pr);
              return (
                <Card key={pr.id} className="bg-slate-900 border-slate-800 hover:border-slate-600 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className="text-slate-500 text-sm font-mono">#{pr.number}</span>
                          {pr.draft && (
                            <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full">Draft</span>
                          )}
                          <span className={`text-xs border px-2 py-0.5 rounded-full ${reviewStatus.color}`}>
                            {reviewStatus.label}
                          </span>
                          {pr.labels.map((label) => (
                            <span
                              key={label.name}
                              className="text-xs px-2 py-0.5 rounded-full border"
                              style={{
                                backgroundColor: `#${label.color}22`,
                                borderColor: `#${label.color}55`,
                                color: `#${label.color}`,
                              }}
                            >
                              {label.name}
                            </span>
                          ))}
                        </div>
                        <h3 className="text-slate-100 font-medium text-base leading-snug mb-2">{pr.title}</h3>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <img src={pr.user.avatar_url} alt={pr.user.login} className="w-4 h-4 rounded-full" />
                          <span>{pr.user.login}</span>
                          <span>·</span>
                          <span>opened {formatDistanceToNow(new Date(pr.created_at), { addSuffix: true })}</span>
                          <span>·</span>
                          <span>updated {formatDistanceToNow(new Date(pr.updated_at), { addSuffix: true })}</span>
                        </div>
                      </div>
                      <a
                        href={pr.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-500 hover:text-blue-400 transition-colors flex-shrink-0 mt-1"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {!loading && owner && repo && prs.length === 0 && !error && (
          <div className="text-center py-20 text-slate-500">
            <GitPullRequest className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No open pull requests</p>
            <p className="text-sm">There are no pending PRs for <span className="font-mono text-slate-400">{owner}/{repo}</span></p>
          </div>
        )}

        {/* Initial state */}
        {!owner && !repo && (
          <div className="text-center py-20 text-slate-500">
            <GitPullRequest className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">Enter a repository to get started</p>
            <p className="text-sm">Track pending pull requests for EarthEye dashboard updates</p>
          </div>
        )}

        {lastFetched && (
          <p className="text-center text-xs text-slate-600 mt-6">
            Last updated: {formatDistanceToNow(lastFetched, { addSuffix: true })}
          </p>
        )}
      </div>
    </div>
  );
}