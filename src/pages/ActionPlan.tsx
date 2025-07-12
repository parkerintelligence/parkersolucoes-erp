import { useState } from "react";
import { Plus, Settings, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ActionBoard } from "@/components/ActionBoard";
import { BoardDialog } from "@/components/BoardDialog";
import { useActionPlan } from "@/hooks/useActionPlan";

export default function ActionPlan() {
  const [isCreateBoardOpen, setIsCreateBoardOpen] = useState(false);
  const [isEditBoardOpen, setIsEditBoardOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState<any>(null);

  const {
    boards,
    columns,
    cards,
    cardItems,
    isLoading,
    selectedBoard,
    setSelectedBoard,
    createBoard,
    updateBoard,
    deleteBoard,
  } = useActionPlan();

  const handleCreateBoard = async (data: any) => {
    await createBoard(data);
    setIsCreateBoardOpen(false);
  };

  const handleUpdateBoard = async (data: any) => {
    if (editingBoard) {
      await updateBoard(editingBoard.id, data);
      setIsEditBoardOpen(false);
      setEditingBoard(null);
    }
  };

  const handleEditBoard = (board: any) => {
    setEditingBoard(board);
    setIsEditBoardOpen(true);
  };

  const handleDeleteBoard = async (boardId: string) => {
    if (window.confirm("Tem certeza que deseja excluir este quadro?")) {
      await deleteBoard(boardId);
      if (selectedBoard === boardId && boards.length > 1) {
        const remainingBoards = boards.filter(b => b.id !== boardId);
        if (remainingBoards.length > 0) {
          setSelectedBoard(remainingBoards[0].id);
        }
      }
    }
  };

  const selectedBoardData = boards.find(b => b.id === selectedBoard);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Plano de Ação</h1>
          <p className="text-muted-foreground">Gerencie suas tarefas e projetos de forma visual</p>
        </div>
        
        <Dialog open={isCreateBoardOpen} onOpenChange={setIsCreateBoardOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Quadro
            </Button>
          </DialogTrigger>
          <BoardDialog onSave={handleCreateBoard} />
        </Dialog>
      </div>

      {/* Board Selector */}
      {boards.length > 0 && (
        <div className="flex items-center gap-4">
          <Select value={selectedBoard || ""} onValueChange={setSelectedBoard}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Selecione um quadro" />
            </SelectTrigger>
            <SelectContent>
              {boards.map((board) => (
                <SelectItem key={board.id} value={board.id}>
                  {board.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedBoardData && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleEditBoard(selectedBoardData)}
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleDeleteBoard(selectedBoardData.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Board Content */}
      {selectedBoard ? (
        <ActionBoard 
          boardId={selectedBoard}
          columns={columns}
          cards={cards}
          cardItems={cardItems}
        />
      ) : boards.length === 0 ? (
        <Card className="p-12 text-center">
          <CardContent>
            <h3 className="text-lg font-medium mb-2">Nenhum quadro encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Crie seu primeiro quadro para começar a organizar suas tarefas
            </p>
            <Dialog open={isCreateBoardOpen} onOpenChange={setIsCreateBoardOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Quadro
                </Button>
              </DialogTrigger>
              <BoardDialog onSave={handleCreateBoard} />
            </Dialog>
          </CardContent>
        </Card>
      ) : null}

      {/* Edit Board Dialog */}
      <Dialog open={isEditBoardOpen} onOpenChange={setIsEditBoardOpen}>
        <BoardDialog 
          board={editingBoard} 
          onSave={handleUpdateBoard} 
        />
      </Dialog>
    </div>
  );
}