import { useState, useMemo } from "react";
import { Plus, LayoutGrid, List, BarChart3, Calendar, Search, Filter, SlidersHorizontal, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

import { ProjectKanban } from "@/components/projects/ProjectKanban";
import { ProjectList } from "@/components/projects/ProjectList";
import { ProjectGantt } from "@/components/projects/ProjectGantt";
import { ProjectCalendar } from "@/components/projects/ProjectCalendar";
import { BoardDialog } from "@/components/BoardDialog";
import { useActionPlan } from "@/hooks/useActionPlan";

export default function ActionPlan() {
  const [isCreateBoardOpen, setIsCreateBoardOpen] = useState(false);
  const [activeView, setActiveView] = useState("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const {
    boards, columns, cards, cardItems, isLoading,
    selectedBoard, setSelectedBoard,
    createBoard, deleteBoard,
  } = useActionPlan();

  const handleCreateBoard = async (data: any) => {
    await createBoard(data);
    setIsCreateBoardOpen(false);
  };

  const handleDeleteBoard = async (boardId: string) => {
    if (window.confirm("Tem certeza que deseja excluir este projeto?")) {
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
    return filtered;
  }, [cards, searchQuery, priorityFilter]);

  const selectedBoardData = boards.find(b => b.id === selectedBoard);

  const stats = useMemo(() => {
    const total = filteredCards.length;
    const completed = cardItems.filter(i => i.is_completed).length;
    const totalItems = cardItems.length;
    const urgent = filteredCards.filter(c => c.priority === 'urgent' || c.priority === 'high').length;
    const overdue = filteredCards.filter(c => c.due_date && new Date(c.due_date) < new Date()).length;
    return { total, completed, totalItems, urgent, overdue };
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestão de Projetos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie suas tarefas com Kanban, Lista, Gantt e Calendário
          </p>
        </div>
        <Dialog open={isCreateBoardOpen} onOpenChange={setIsCreateBoardOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4 mr-2" />
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
              <LayoutGrid className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Nenhum projeto encontrado</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Crie seu primeiro projeto para começar a organizar suas tarefas como no Trello
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
          {/* Project Tabs */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {boards.map(board => (
                <div key={board.id} className="flex items-center group">
                  <Button
                    variant={selectedBoard === board.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedBoard(board.id)}
                    className={`gap-2 ${selectedBoard === board.id
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                      : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`}
                  >
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: board.color || 'hsl(var(--primary))' }} />
                    {board.name}
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-background/50">
                      {columns.filter(c => c.board_id === board.id).length}
                    </Badge>
                  </Button>
                  {selectedBoard === board.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteBoard(board.id)}
                      className="ml-1 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
              <Dialog open={isCreateBoardOpen} onOpenChange={setIsCreateBoardOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="border-dashed border border-border text-muted-foreground hover:text-foreground">
                    <Plus className="h-3.5 w-3.5 mr-1" /> Novo
                  </Button>
                </DialogTrigger>
                <BoardDialog onSave={handleCreateBoard} />
              </Dialog>
            </div>

            {/* Stats bar */}
            <div className="flex flex-wrap gap-3">
              {[
                { label: "Cards", value: stats.total, color: "text-primary" },
                { label: "Checklist", value: `${stats.completed}/${stats.totalItems}`, color: "text-primary" },
                { label: "Urgentes", value: stats.urgent, color: "text-destructive" },
                { label: "Atrasados", value: stats.overdue, color: "text-warning" },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border">
                  <span className={`text-sm font-bold ${s.color}`}>{s.value}</span>
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                </div>
              ))}
            </div>

            {/* Toolbar: Search + Filters + View Switcher */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-card border-border h-9"
                />
              </div>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-40 h-9 bg-card border-border">
                  <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center bg-card border border-border rounded-lg p-0.5">
                {[
                  { value: "kanban", icon: LayoutGrid, label: "Kanban" },
                  { value: "list", icon: List, label: "Lista" },
                  { value: "gantt", icon: BarChart3, label: "Gantt" },
                  { value: "calendar", icon: Calendar, label: "Calendário" },
                ].map(view => (
                  <Button
                    key={view.value}
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveView(view.value)}
                    className={`h-7 px-3 gap-1.5 rounded-md text-xs ${
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
          </div>

          {/* Content Views */}
          {selectedBoard && (
            <div className="min-h-[500px]">
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
                />
              )}
              {activeView === "gantt" && (
                <ProjectGantt
                  columns={boardColumns}
                  cards={filteredCards}
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
