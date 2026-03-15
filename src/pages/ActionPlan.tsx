import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { Plus, Trash2, FolderKanban, CheckCircle2, Clock, TrendingUp, Target, ExternalLink, Edit } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BoardDialog } from "@/components/BoardDialog";
import { useActionPlan } from "@/hooks/useActionPlan";

export default function ActionPlan() {
  const navigate = useNavigate();
  const [isCreateBoardOpen, setIsCreateBoardOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState<any>(null);
  const { boards, columns, cards, cardItems, isLoading, createBoard, updateBoard, deleteBoard } = useActionPlan();
  const { confirm } = useConfirmDialog();

  const handleCreateBoard = async (data: any) => {
    const board = await createBoard(data);
    setIsCreateBoardOpen(false);
    if (board?.id) navigate(`/projetos/${board.id}`);
  };

  const handleDeleteBoard = async (e: React.MouseEvent, boardId: string) => {
    e.stopPropagation();
    const confirmed = await confirm({
      title: "Excluir projeto",
      description: "Tem certeza que deseja excluir este projeto e todas as suas tarefas?",
    });
    if (confirmed) await deleteBoard(boardId);
  };

  const handleEditBoard = (e: React.MouseEvent, board: any) => {
    e.stopPropagation();
    setEditingBoard(board);
  };

  const handleUpdateBoard = async (data: any) => {
    if (editingBoard) {
      await updateBoard(editingBoard.id, data);
      setEditingBoard(null);
    }
  };

  // Compute stats per board
  const getBoardStats = (boardId: string) => {
    const boardCols = columns.filter(c => c.board_id === boardId);
    const colIds = new Set(boardCols.map(c => c.id));
    const boardCards = cards.filter(c => colIds.has(c.column_id));
    const total = boardCards.length;

    const getProgress = (cardId: string) => {
      const items = cardItems.filter(i => i.card_id === cardId);
      if (items.length === 0) return 0;
      return Math.round((items.filter(i => i.is_completed).length / items.length) * 100);
    };

    const completed = boardCards.filter(c => getProgress(c.id) === 100).length;
    const inProgress = boardCards.filter(c => { const p = getProgress(c.id); return p > 0 && p < 100; }).length;
    const totalProgress = total > 0 ? Math.round(boardCards.reduce((sum, c) => sum + getProgress(c.id), 0) / total) : 0;
    const phases = boardCols.length;

    return { total, completed, inProgress, totalProgress, phases };
  };

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
            Planeje, acompanhe e gerencie todos os seus projetos
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
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          {/* Grid Header */}
          <div className="flex items-center justify-between bg-secondary/30 border-b border-border px-4 py-2.5">
            <div className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-primary" />
              <span className="font-bold text-sm text-foreground">Projetos</span>
              <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-muted">{boards.length}</Badge>
            </div>
          </div>

          {/* Column Headers */}
          <div className="grid grid-cols-[1fr_80px_80px_80px_160px_60px] gap-0 px-4 py-1.5 bg-secondary/10 border-b border-border">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Projeto</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Fases</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Tarefas</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Status</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Progresso</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Ações</span>
          </div>

          {/* Rows */}
          {boards.map((board, idx) => {
            const stats = getBoardStats(board.id);
            return (
              <div
                key={board.id}
                onClick={() => navigate(`/projetos/${board.id}`)}
                className={`grid grid-cols-[1fr_80px_80px_80px_160px_60px] gap-0 px-4 py-2.5 items-center border-b border-border/50 last:border-b-0 cursor-pointer transition-colors ${
                  idx % 2 === 0 ? 'bg-background hover:bg-primary/5' : 'bg-card hover:bg-primary/5'
                }`}
              >
                {/* Project Name */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: board.color || 'hsl(var(--primary))' }} />
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-foreground truncate block">{board.name}</span>
                    {board.description && (
                      <span className="text-[10px] text-muted-foreground truncate block" title={board.description}>
                        {board.description}
                      </span>
                    )}
                  </div>
                </div>

                {/* Phases */}
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-muted w-fit">
                  {stats.phases}
                </Badge>

                {/* Tasks */}
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-muted w-fit">
                  {stats.total}
                </Badge>

                {/* Status summary */}
                <div className="flex items-center gap-1">
                  {stats.completed > 0 && (
                    <span className="flex items-center gap-0.5 text-[10px] text-green-500">
                      <CheckCircle2 className="h-3 w-3" />{stats.completed}
                    </span>
                  )}
                  {stats.inProgress > 0 && (
                    <span className="flex items-center gap-0.5 text-[10px] text-primary">
                      <TrendingUp className="h-3 w-3" />{stats.inProgress}
                    </span>
                  )}
                  {stats.total === 0 && (
                    <span className="text-[10px] text-muted-foreground">—</span>
                  )}
                </div>

                {/* Progress */}
                <div className="flex items-center gap-2">
                  <Progress value={stats.totalProgress} className="h-1.5 flex-1" />
                  <span className="text-[10px] font-bold text-muted-foreground min-w-[28px] text-right">{stats.totalProgress}%</span>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-0.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleDeleteBoard(e, board.id)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
