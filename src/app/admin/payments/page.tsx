"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@frontend/components/ui/card";
import { Input } from "@frontend/components/ui/input";
import { Badge } from "@frontend/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@frontend/components/ui/table";
import { toast } from "sonner";
import {
  Search,
  DollarSign,
  CreditCard,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface Payment {
  id: string;
  stripeSessionId?: string;
  stripeSubscriptionId?: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  currency: string;
  method: string;
  status: "pending" | "paid" | "failed" | "refunded" | "expired";
  plan: string;
  createdAt: string;
  paidAt?: string;
}

interface Stats {
  totalPayments: number;
  totalRevenue: number;
  pendingCount: number;
  paidCount: number;
}

export default function PaymentsPage() {
  const { t, language } = useTranslation();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalPayments: 0,
    totalRevenue: 0,
    pendingCount: 0,
    paidCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await fetch("/api/admin/payments");
      const data = await response.json();
      setPayments(data.payments || []);
      setStats(data.stats || {
        totalPayments: 0,
        totalRevenue: 0,
        pendingCount: 0,
        paidCount: 0,
      });
    } catch (error) {
      console.error("Erro ao buscar pagamentos:", error);
      toast.error(t.admin.payments.errorLoading);
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter(payment =>
    payment.userName?.toLowerCase().includes(search.toLowerCase()) ||
    payment.userEmail?.toLowerCase().includes(search.toLowerCase()) ||
    payment.stripeSessionId?.toLowerCase().includes(search.toLowerCase()) ||
    payment.stripeSubscriptionId?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            {t.admin.payments.status.paid}
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/30">
            <Clock className="h-3 w-3 mr-1" />
            {t.admin.payments.status.pending}
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-500/10 text-red-500 border-red-500/30">
            <XCircle className="h-3 w-3 mr-1" />
            {t.admin.payments.status.failed}
          </Badge>
        );
      case "expired":
        return (
          <Badge className="bg-red-500/10 text-red-500 border-red-500/30">
            <XCircle className="h-3 w-3 mr-1" />
            {t.admin.payments.status.expired}
          </Badge>
        );
      case "refunded":
        return (
          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/30">
            {t.admin.payments.status.refunded}
          </Badge>
        );
      default:
        return null;
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case "PIX":
        return <span className="text-emerald-500 font-medium">PIX</span>;
      case "CREDIT_CARD":
        return <span className="text-blue-500 font-medium">Cartão</span>;
      case "BOLETO":
        return <span className="text-amber-500 font-medium">Boleto</span>;
      default:
        return <span className="text-zinc-400">{method}</span>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-zinc-800 rounded w-48 animate-pulse" />
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-zinc-800 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">{t.admin.payments.title}</h1>
        <p className="text-zinc-400 mt-1">{t.admin.payments.subtitle}</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-emerald-500/10">
              <DollarSign className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">{t.admin.payments.stats.totalRevenue}</p>
              <p className="text-xl font-bold text-white">
                {language === 'pt' ? 'R$' : '$'} {stats.totalRevenue.toLocaleString(language === 'pt' ? 'pt-BR' : 'en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <CreditCard className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">{t.admin.payments.stats.totalPayments}</p>
              <p className="text-xl font-bold text-white">{stats.totalPayments}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-emerald-500/10">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">{t.admin.payments.stats.paid}</p>
              <p className="text-xl font-bold text-white">{stats.paidCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-amber-500/10">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">{t.admin.payments.stats.pending}</p>
              <p className="text-xl font-bold text-white">{stats.pendingCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-white">{t.admin.payments.title}</CardTitle>
              <CardDescription className="text-zinc-400">
                {filteredPayments.length} {t.admin.payments.table.paymentsFound}
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                placeholder={t.admin.payments.searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">{t.admin.payments.table.noPayments}</h3>
              <p className="text-zinc-400">{t.admin.payments.subtitle}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">{t.admin.payments.table.id}</TableHead>
                  <TableHead className="text-zinc-400">{t.admin.payments.table.user}</TableHead>
                  <TableHead className="text-zinc-400">{t.admin.payments.table.plan}</TableHead>
                  <TableHead className="text-zinc-400">{t.admin.payments.table.amount}</TableHead>
                  <TableHead className="text-zinc-400">{t.admin.payments.table.method}</TableHead>
                  <TableHead className="text-zinc-400">{t.admin.payments.table.status}</TableHead>
                  <TableHead className="text-zinc-400">{t.admin.payments.table.date}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id} className="border-zinc-800 hover:bg-zinc-800/30">
                    <TableCell>
                      <code className="text-sm text-zinc-300 bg-zinc-800 px-2 py-1 rounded font-mono">
                        {payment.stripeSessionId?.substring(0, 12) || payment.stripeSubscriptionId?.substring(0, 12) || payment.id.substring(0, 12)}...
                      </code>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-zinc-300">{payment.userName}</p>
                        <p className="text-xs text-zinc-500">{payment.userEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-zinc-700 text-zinc-300 capitalize">
                        {payment.plan || "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-white font-medium">
                      {language === 'pt' ? 'R$' : '$'} {payment.amount.toLocaleString(language === 'pt' ? 'pt-BR' : 'en-US', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>{getMethodLabel(payment.method)}</TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell className="text-zinc-400">
                      {new Date(payment.createdAt).toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
