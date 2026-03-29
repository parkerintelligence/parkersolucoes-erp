import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { Plus, LayoutGrid, List, BarChart3, Calendar, Search, ArrowLeft, FolderKanban, CheckCircle2, AlertTriangle, Clock, TrendingUp, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog } from "@/components/ui/dialog";

import { ProjectKanban } from "@/components/projects/ProjectKanban";
import { ProjectList } from "@/components/projects/ProjectList";
import { ProjectGantt } from "@/components/projects/ProjectGantt";
import { ProjectCalendar } from "@/components/projects/ProjectCalendar";
import { CardDialog } from "@/components/CardDialog";
import { useActionPlan } from "@/hooks/useActionPlan";
import { isPast, isToday } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false);

  const {
    boards, columns, cards, cardItems, isLoading,
    selectedBoard, setSelectedBoard, fetchData,
  } = useActionPlan();

  // Set board from URL param
  if (id && selectedBoard !== id) {
    setSelectedBoard(id);
  }

  const selectedBoardData = boards.find(b => b.id === id);

  const boardColumns = useMemo(() =>
    columns.filter(col => col.board_id === id),
    [columns, id]
  );

  const getCardProgress = (cardId: string) => {
    const items = cardItems.filter(i => i.card_id === cardId);
    if (items.length === 0) return 0;
    return Math.round((items.filter(i => i.is_completed).length / items.length) * 100);
  };

  const filteredCards = useMemo(() => {
    let filtered = cards;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
      );
    }
    if (priorityFilter !== "all") {
      filtered = filtered.filter(c => c.priority === priorityFilter);
    }
    if (statusFilter === "overdue") {
      filtered = filtered.filter(c => c.due_date && isPast(new Date(c.due_date)) && !isToday(new Date(c.due_date)));
    } else if (statusFilter === "completed") {
      filtered = filtered.filter(c => getCardProgress(c.id) === 100);
    } else if (statusFilter === "in_progress") {
      filtered = filtered.filter(c => {
        const p = getCardProgress(c.id);
        return p > 0 && p < 100;
      });
    } else if (statusFilter === "not_started") {
      filtered = filtered.filter(c => getCardProgress(c.id) === 0);
    }
    return filtered;
  }, [cards, searchQuery, priorityFilter, statusFilter, cardItems]);

  const stats = useMemo(() => {
    const total = filteredCards.length;
    const completedCards = filteredCards.filter(c => getCardProgress(c.id) === 100).length;
    const inProgressCards = filteredCards.filter(c => { const p = getCardProgress(c.id); return p > 0 && p < 100; }).length;
    const notStartedCards = filteredCards.filter(c => getCardProgress(c.id) === 0).length;
    const urgent = filteredCards.filter(c => c.priority === 'urgent' || c.priority === 'high').length;
    const overdue = filteredCards.filter(c => c.due_date && isPast(new Date(c.due_date)) && !isToday(new Date(c.due_date))).length;
    const totalProgress = total > 0 ? Math.round(filteredCards.reduce((sum, c) => sum + getCardProgress(c.id), 0) / total) : 0;
    return { total, completedCards, inProgressCards, notStartedCards, urgent, overdue, totalProgress };
  }, [filteredCards, cardItems]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Carregando projeto...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate('/projetos')} className="h-8 text-xs gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar
          </Button>
          <div className="flex items-center gap-2">
            {selectedBoardData?.color && (
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedBoardData.color }} />
            )}
            <h1 className="text-xl font-bold text-foreground">
              {selectedBoardData?.name || 'Projeto'}
            </h1>
          </div>
          {selectedBoardData?.description && (
            <span className="text-xs text-muted-foreground hidden sm:inline">
              — {selectedBoardData.description}
            </span>
          )}
        </div>
        <Button size="sm" className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20" onClick={() => setShowNewTaskDialog(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Nova Tarefa
        </Button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {[
          { label: "Total", value: stats.total, icon: Target, color: "text-primary" },
          { label: "Concluídas", value: stats.completedCards, icon: CheckCircle2, color: "text-green-500" },
          { label: "Em Progresso", value: stats.inProgressCards, icon: TrendingUp, color: "text-primary" },
          { label: "Não Iniciadas", value: stats.notStartedCards, icon: Clock, color: "text-muted-foreground" },
          { label: "Urgentes", value: stats.urgent, icon: AlertTriangle, color: "text-destructive" },
          { label: "Atrasadas", value: stats.overdue, icon: Clock, color: "text-destructive" },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border">
            <s.icon className={`h-3.5 w-3.5 ${s.color} flex-shrink-0`} />
            <div className="min-w-0">
              <span className={`text-sm font-bold ${s.color}`}>{s.value}</span>
              <span className="text-[10px] text-muted-foreground ml-1.5">{s.label}</span>
            </div>
          </div>
        ))}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-muted-foreground">Progresso Geral</span>
              <span className="text-xs font-bold text-primary">{stats.totalProgress}%</span>
            </div>
            <Progress value={stats.totalProgress} className="h-1.5" />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar tarefas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 bg-card border-border h-8 text-xs"
          />
        </div>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-32 h-8 bg-card border-border text-xs">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Prioridades</SelectItem>
            <SelectItem value="urgent">🔴 Urgente</SelectItem>
            <SelectItem value="high">🟠 Alta</SelectItem>
            <SelectItem value="medium">🔵 Média</SelectItem>
            <SelectItem value="low">⚪ Baixa</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 h-8 bg-card border-border text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="completed">✅ Concluídas</SelectItem>
            <SelectItem value="in_progress">🔄 Em Progresso</SelectItem>
            <SelectItem value="not_started">⏳ Não Iniciadas</SelectItem>
            <SelectItem value="overdue">⚠️ Atrasadas</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center bg-card border border-border rounded-lg p-0.5 ml-auto">
          {[
            { value: "gantt", icon: BarChart3, label: "Gantt" },
            { value: "kanban", icon: LayoutGrid, label: "Kanban" },
            { value: "list", icon: List, label: "Lista" },
            { value: "calendar", icon: Calendar, label: "Calendário" },
          ].map(view => (
            <Button
              key={view.value}
              variant="ghost"
              size="sm"
              onClick={() => setActiveView(view.value)}
              className={`h-7 px-2.5 gap-1 rounded-md text-[11px] ${
                activeView === view.value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <view.icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{view.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Content Views */}
      <div className="min-h-[500px]">
        {activeView === "gantt" && (
          <ProjectGantt columns={boardColumns} cards={filteredCards} cardItems={cardItems} />
        )}
        {activeView === "kanban" && id && (
          <ProjectKanban boardId={id} columns={boardColumns} cards={filteredCards} cardItems={cardItems} />
        )}
        {activeView === "list" && (
          <ProjectList columns={boardColumns} cards={filteredCards} cardItems={cardItems} onRefresh={async () => { await fetchData(); }} />
        )}
        {activeView === "calendar" && (
          <ProjectCalendar cards={filteredCards} columns={boardColumns} />
        )}
      </div>
    </div>
  );
}
