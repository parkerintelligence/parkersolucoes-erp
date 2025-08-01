
import { useState } from "react";
import { Plus, Settings, Trash2, MoreHorizontal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Plano de Ação</h1>
              <p className="text-muted-foreground text-sm">Gerencie suas tarefas e projetos de forma visual</p>
            </div>
            
            <Dialog open={isCreateBoardOpen} onOpenChange={setIsCreateBoardOpen}>
              <DialogTrigger asChild>
                <Button className="shadow-md">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Quadro
                </Button>
              </DialogTrigger>
              <BoardDialog onSave={handleCreateBoard} />
            </Dialog>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="container mx-auto px-6 py-6">
        {boards.length === 0 ? (
          <Card className="p-12 text-center shadow-lg border-dashed">
            <CardContent>
              <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Nenhum quadro encontrado</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Crie seu primeiro quadro para começar a organizar suas tarefas de forma visual e eficiente
              </p>
              <Dialog open={isCreateBoardOpen} onOpenChange={setIsCreateBoardOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="shadow-md">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Quadro
                  </Button>
                </DialogTrigger>
                <BoardDialog onSave={handleCreateBoard} />
              </Dialog>
            </CardContent>
          </Card>
        ) : (
          <Tabs value={selectedBoard || ""} onValueChange={setSelectedBoard} className="w-full">
            <div className="flex items-center justify-between mb-6">
              <TabsList className="h-12 p-1 bg-background/60 backdrop-blur border shadow-sm">
                {boards.map((board) => {
                  const columnsCount = columns.filter(col => col.board_id === board.id).length;
                  return (
                    <div key={board.id} className="flex items-center group">
                      <TabsTrigger 
                        value={board.id}
                        className="relative px-6 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-medium">{board.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {columnsCount} {columnsCount === 1 ? 'coluna' : 'colunas'}
                          </span>
                        </div>
                      </TabsTrigger>
                      
                      {selectedBoard === board.id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="ml-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditBoard(board)}>
                              <Settings className="h-4 w-4 mr-2" />
                              Editar Quadro
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteBoard(board.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir Quadro
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  );
                })}
                
                <Dialog open={isCreateBoardOpen} onOpenChange={setIsCreateBoardOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="ml-2 h-10 px-4 border-dashed border-2 border-muted-foreground/25 hover:border-primary/50"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Novo
                    </Button>
                  </DialogTrigger>
                  <BoardDialog onSave={handleCreateBoard} />
                </Dialog>
              </TabsList>
            </div>

            {boards.map((board) => (
              <TabsContent key={board.id} value={board.id} className="mt-0">
                <ActionBoard 
                  boardId={board.id}
                  columns={columns}
                  cards={cards}
                  cardItems={cardItems}
                />
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>

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
