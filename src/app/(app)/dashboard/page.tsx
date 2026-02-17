import Link from 'next/link';
import { getRequiredUser } from '@/lib/db/helpers';
import { getDashboardData } from '@/lib/db/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, Clock, MessageCircle, CheckCircle } from 'lucide-react';

export default async function OutreachDashboardPage() {
  const user = await getRequiredUser();
  const data = await getDashboardData(user.id!);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Outreach Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Daily outreach workflow at a glance
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Sequences
            </CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.stats.activeSequences}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sent Today
            </CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.stats.sentToday}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Response Rate
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.stats.responseRate}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm font-medium">
              Ready to Send
              <Badge variant="secondary">{data.readyToSend.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.readyToSend.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending first messages</p>
            ) : (
              <div className="space-y-2">
                {data.readyToSend.map((item) => (
                  <Link
                    key={item.prospectId}
                    href={`/prospects/${item.prospectId}`}
                    className="block rounded-md p-2 text-sm hover:bg-accent"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm font-medium">
              Follow-ups Due
              <Badge variant="secondary">{data.followUpsDue.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.followUpsDue.length === 0 ? (
              <p className="text-sm text-muted-foreground">No follow-ups due today</p>
            ) : (
              <div className="space-y-2">
                {data.followUpsDue.map((item) => (
                  <Link
                    key={item.prospectId}
                    href={`/prospects/${item.prospectId}`}
                    className="flex items-center justify-between rounded-md p-2 text-sm hover:bg-accent"
                  >
                    <span>{item.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.dueDate).toLocaleDateString()}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm font-medium">
              Awaiting Response
              <Badge variant="secondary">{data.awaitingResponse.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.awaitingResponse.length === 0 ? (
              <p className="text-sm text-muted-foreground">No messages awaiting response</p>
            ) : (
              <div className="space-y-2">
                {data.awaitingResponse.map((item) => (
                  <Link
                    key={item.prospectId}
                    href={`/prospects/${item.prospectId}`}
                    className="flex items-center justify-between rounded-md p-2 text-sm hover:bg-accent"
                  >
                    <span>{item.name}</span>
                    {item.sentAt && (
                      <span className="text-xs text-muted-foreground">
                        Sent {new Date(item.sentAt).toLocaleDateString()}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm font-medium">
              Recently Responded
              <Badge variant="secondary">{data.recentlyResponded.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentlyResponded.length === 0 ? (
              <p className="text-sm text-muted-foreground">No responses in the last 7 days</p>
            ) : (
              <div className="space-y-2">
                {data.recentlyResponded.map((item) => (
                  <Link
                    key={item.prospectId}
                    href={`/prospects/${item.prospectId}`}
                    className="flex items-center justify-between rounded-md p-2 text-sm hover:bg-accent"
                  >
                    <span>{item.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.respondedAt).toLocaleDateString()}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
