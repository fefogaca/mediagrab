'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@frontend/components/ui/card';
import { Badge } from '@frontend/components/ui/badge';
import { Avatar, AvatarFallback } from '@frontend/components/ui/avatar';
import { Users, Crown } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface TopUser {
  id: string;
  name: string;
  email: string;
  plan: string;
  downloads?: number;
}

export default function DashboardCardTopUsers() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<TopUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/admin/users');
        if (response.ok) {
          const data = await response.json();
          setUsers(data.users?.slice(0, 5) || []);
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const getPlanColor = (plan: string) => {
    switch (plan?.toLowerCase()) {
      case 'enterprise':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/30';
      case 'startup':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/30';
      case 'developer':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
      default:
        return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/30';
    }
  };

  return (
    <Card className="col-span-12 lg:col-span-6 bg-zinc-900/50 border-zinc-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-500" />
          {t.admin.dashboard.recentUsers}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-zinc-800 rounded animate-pulse" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-10 w-10 text-zinc-600 mx-auto mb-2" />
            <p className="text-zinc-500">{t.admin.dashboard.noUsersAvailable}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((user, index) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-zinc-700 text-white text-sm">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    {index === 0 && (
                      <Crown className="h-3 w-3 text-amber-500 absolute -top-1 -right-1" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{user.name || 'Usuário'}</p>
                    <p className="text-xs text-zinc-500">{user.email}</p>
                  </div>
                </div>
                <Badge variant="outline" className={getPlanColor(user.plan)}>
                  {user.plan || 'free'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
