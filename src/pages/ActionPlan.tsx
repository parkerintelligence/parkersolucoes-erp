import React, { useState } from "react";
import { Plus, Settings, Trash2, MoreHorizontal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { SafeTabs, SafeTabsContent, SafeTabsList, SafeTabsTrigger } from "@/components/SafeTabsWrapper";
import { SafeComponentWrapper } from "@/components/SafeComponentWrapper";

import { ActionBoard } from "@/components/ActionBoard";
import { BoardDialog } from "@/components/BoardDialog";
import { useActionPlan } from "@/hooks/useActionPlan";
export default function ActionPlan() {
  return (
    <SafeComponentWrapper>
      <ActionPlanContent />
    </SafeComponentWrapper>
  );
}

function ActionPlanContent() {
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
    deleteBoard
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
    return <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Carregando...</div>
      </div>;
  }
  return <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-800/95 backdrop-blur">
        <div className="container mx-auto px-6 py-4 bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Plano de Ação</h1>
              <p className="text-slate-300 text-sm">Gerencie suas tarefas e projetos de forma visual</p>
            </div>
            
            <Dialog open={isCreateBoardOpen} onOpenChange={setIsCreateBoardOpen}>
              <DialogTrigger asChild>
                <Button className="shadow-md bg-blue-600 hover:bg-blue-700 text-white">
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
        {boards.length === 0 ? <Card className="p-12 text-center shadow-lg border-dashed bg-slate-800 border-slate-600">
            <CardContent>
              <div className="mx-auto w-24 h-24 bg-slate-700 rounded-full flex items-center justify-center mb-4">
                <Plus className="h-8 w-8 text-slate-300" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Nenhum quadro encontrado</h3>
              <p className="text-slate-300 mb-6 max-w-md mx-auto">
                Crie seu primeiro quadro para começar a organizar suas tarefas de forma visual e eficiente
              </p>
              <Dialog open={isCreateBoardOpen} onOpenChange={setIsCreateBoardOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="shadow-md bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Quadro
                  </Button>
                </DialogTrigger>
                <BoardDialog onSave={handleCreateBoard} />
              </Dialog>
            </CardContent>
          </Card> : <SafeTabs value={selectedBoard || ""} onValueChange={setSelectedBoard} className="w-full">
            <div className="flex items-center justify-between mb-6">
              <SafeTabsList className="h-12 p-1 bg-slate-800/60 backdrop-blur border border-slate-600 shadow-sm">
                {boards.map(board => {
              const columnsCount = columns.filter(col => col.board_id === board.id).length;
              return <div key={board.id} className="flex items-center group">
                      <SafeTabsTrigger value={board.id} className="relative px-6 py-2 data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm data-[state=active]:text-white text-slate-300 hover:text-white">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-medium">{board.name}</span>
                          <span className="text-xs opacity-70">
                            {columnsCount} {columnsCount === 1 ? 'coluna' : 'colunas'}
                          </span>
                        </div>
                      </SafeTabsTrigger>
                      
                      {selectedBoard === board.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteBoard(board.id)}
                          className="ml-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-white hover:bg-slate-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>;
            })}
                
                <Dialog open={isCreateBoardOpen} onOpenChange={setIsCreateBoardOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="ml-2 h-10 px-4 border-dashed border-2 border-slate-600/50 hover:border-blue-500/50 text-slate-300 hover:text-white hover:bg-slate-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Novo
                    </Button>
                  </DialogTrigger>
                  <BoardDialog onSave={handleCreateBoard} />
                </Dialog>
              </SafeTabsList>
            </div>

            {boards.map(board => <SafeTabsContent key={board.id} value={board.id} className="mt-0">
                <ActionBoard boardId={board.id} columns={columns} cards={cards} cardItems={cardItems} />
              </SafeTabsContent>)}
          </SafeTabs>}
      </div>

      {/* Edit Board Dialog */}
      <Dialog open={isEditBoardOpen} onOpenChange={setIsEditBoardOpen}>
        <BoardDialog board={editingBoard} onSave={handleUpdateBoard} />
      </Dialog>
    </div>;
}