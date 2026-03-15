import { useState, useMemo } from "react";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { Plus, LayoutGrid, List, BarChart3, Calendar, Search, Filter, Trash2, FolderKanban, CheckCircle2, AlertTriangle, Clock, TrendingUp, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

import { ProjectKanban } from "@/components/projects/ProjectKanban";
import { ProjectList } from "@/components/projects/ProjectList";
import { ProjectGantt } from "@/components/projects/ProjectGantt";
import { ProjectCalendar } from "@/components/projects/ProjectCalendar";
import { BoardDialog } from "@/components/BoardDialog";
import { useActionPlan } from "@/hooks/useActionPlan";
import { differenceInDays, isPast, isToday } from "date-fns";

export default function ActionPlan() {
  const [isCreateBoardOpen, setIsCreateBoardOpen] = useState(false);
  const [activeView, setActiveView] = useState("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const {
    boards, columns, cards, cardItems, isLoading,
    selectedBoard, setSelectedBoard,
    createBoard, deleteBoard, fetchData,
  } = useActionPlan();

  const handleCreateBoard = async (data: any) => {
    await createBoard(data);
    setIsCreateBoardOpen(false);
  };

  const { confirm } = useConfirmDialog();

  const handleDeleteBoard = async (boardId: string) => {
    const confirmed = await confirm({
      title: "Excluir projeto",
      description: "Tem certeza que deseja excluir este projeto e todas as suas tarefas?",
    });
    if (confirmed) {
      await deleteBoard(boardId);
      if (selectedBoard === boardId && boards.length > 1) {
        const remaining = boards.filter(b => b.id !== boardId);
        if (remaining.length > 0) setSelectedBoard(remaining[0].id);
      }
    }
  };

  const boardColumns = useMemo(() =>
    columns.filter(col => col.board_id === selectedBoard),
    [columns, selectedBoard]
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

  const selectedBoardData = boards.find(b => b.id === selectedBoard);

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
          <p className="text-sm text-muted-foreground">Carregando projetos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <FolderKanban className="h-5 w-5 text-primary" />
            Gestão de Projetos
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Planeje, acompanhe e gerencie todas as tarefas do projeto
          </p>
        </div>
        <Dialog open={isCreateBoardOpen} onOpenChange={setIsCreateBoardOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Novo Projeto
            </Button>
          </DialogTrigger>
          <BoardDialog onSave={handleCreateBoard} />
        </Dialog>
      </div>

      {boards.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2 border-border bg-card/50">
          <CardContent className="flex flex-col items-center">
            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
              <FolderKanban className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Nenhum projeto encontrado</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Crie seu primeiro projeto para começar a gerenciar tarefas com Gantt, Kanban, Lista e Calendário
            </p>
            <Dialog open={isCreateBoardOpen} onOpenChange={setIsCreateBoardOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Projeto
                </Button>
              </DialogTrigger>
              <BoardDialog onSave={handleCreateBoard} />
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Project Grid Selector */}
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="flex items-center justify-between bg-secondary/30 border-b border-border px-4 py-2.5">
              <div className="flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-primary" />
                <span className="font-bold text-sm text-foreground">Projetos</span>
                <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-muted">{boards.length}</Badge>
              </div>
              <Dialog open={isCreateBoardOpen} onOpenChange={setIsCreateBoardOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground">
                    <Plus className="h-3 w-3 mr-1" /> Novo
                  </Button>
                </DialogTrigger>
                <BoardDialog onSave={handleCreateBoard} />
              </Dialog>
            </div>
            {/* Column Header */}
            <div className="grid grid-cols-[1fr_120px_80px_60px] gap-0 px-4 py-1.5 bg-secondary/10 border-b border-border">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Nome do Projeto</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Descrição</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Tarefas</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Ações</span>
            </div>
            {/* Rows */}
            {boards.map((board, idx) => {
              const boardCardCount = cards.filter(c => columns.filter(col => col.board_id === board.id).some(col => col.id === c.column_id)).length;
              const isActive = selectedBoard === board.id;
              return (
                <div
                  key={board.id}
                  onClick={() => setSelectedBoard(board.id)}
                  className={`grid grid-cols-[1fr_120px_80px_60px] gap-0 px-4 py-2 items-center border-b border-border/50 last:border-b-0 cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-primary/10 hover:bg-primary/15 border-l-2 border-l-primary'
                      : idx % 2 === 0 ? 'bg-background hover:bg-primary/5' : 'bg-card hover:bg-primary/5'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: board.color || 'hsl(var(--primary))' }} />
                    <span className={`text-xs truncate ${isActive ? 'font-semibold text-foreground' : 'font-medium text-foreground'}`}>
                      {board.name}
                    </span>
                    {isActive && <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-primary/20 text-primary">Ativo</Badge>}
                  </div>
                  <span className="text-xs text-muted-foreground truncate" title={board.description || ''}>
                    {board.description || '-'}
                  </span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-muted w-fit">
                    {boardCardCount}
                  </Badge>
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); handleDeleteBoard(board.id); }}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stats Bar - MS Project Style */}
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

          {/* Toolbar: Search + Filters + View Switcher */}
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
          {selectedBoard && (
            <div className="min-h-[500px]">
              {activeView === "gantt" && (
                <ProjectGantt
                  columns={boardColumns}
                  cards={filteredCards}
                  cardItems={cardItems}
                />
              )}
              {activeView === "kanban" && (
                <ProjectKanban
                  boardId={selectedBoard}
                  columns={boardColumns}
                  cards={filteredCards}
                  cardItems={cardItems}
                />
              )}
              {activeView === "list" && (
                <ProjectList
                  columns={boardColumns}
                  cards={filteredCards}
                  cardItems={cardItems}
                  onRefresh={async () => { await fetchData(); }}
                />
              )}
              {activeView === "calendar" && (
                <ProjectCalendar
                  cards={filteredCards}
                  columns={boardColumns}
                />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
