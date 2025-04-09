import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Repo {
  id: number;
  name: string;
  description: string;
  stargazers_count: number;
  forks_count: number;
  owner: {
    login: string;
  };
}

interface CommitDay {
  date: string;
  commits: number;
}

interface CommitWeek {
  week: number;
  total: number;
  days: number[];
}

const GitHubProfileAnalyzer: React.FC = () => {
  const [username, setUsername] = useState<string>('ajay-7415');
  const [repos, setRepos] = useState<Repo[]>([]);
  const [commitData, setCommitData] = useState<CommitDay[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchRepos = async () => {
    setLoading(true);
    try {
      const repoRes = await axios.get<Repo[]>(`https://api.github.com/users/${username}/repos`);
      setRepos(repoRes.data);
      if (repoRes.data.length > 0) {
        const mainRepo = repoRes.data[0];
        fetchCommitStats(mainRepo.owner.login, mainRepo.name);
      }
    } catch (err) {
      console.error(err);
      setRepos([]);
      setCommitData([]);
    }
    setLoading(false);
  };

  const fetchCommitStats = async (owner: string, repo: string) => {
    try {
      const statsRes = await axios.get<CommitWeek[]>(`https://api.github.com/repos/${owner}/${repo}/stats/commit_activity`);
      const weeklyData = statsRes.data;
      const dailyCommits: CommitDay[] = weeklyData.flatMap(week => 
        week.days.map((commits, i) => ({
          date: new Date((week.week + i * 86400) * 1000).toISOString().slice(0, 10),
          commits
        }))
      ).slice(-30); // last 30 days
      setCommitData(dailyCommits);
    } catch (err) {
      console.error(err);
      setCommitData([]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex gap-2">
        <Input 
          placeholder="Enter GitHub username" 
          value={username} 
          onChange={e => setUsername(e.target.value)} 
        />
        <Button onClick={fetchRepos}>Analyze</Button>
      </div>

      {loading && <p>Loading...</p>}

      {repos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {repos.map(repo => (
            <Card key={repo.id}>
              <CardContent className="p-4">
                <h2 className="font-bold text-lg">{repo.name}</h2>
                <p className="text-sm text-gray-500">{repo.description}</p>
                <div className="text-xs mt-2 text-gray-400">
                  ⭐ {repo.stargazers_count} | 🍴 {repo.forks_count}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {commitData.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Commits in Last 30 Days (First Repo)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={commitData}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} hide />
              <YAxis />
              <Tooltip />
              <Bar dataKey="commits" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default GitHubProfileAnalyzer;
