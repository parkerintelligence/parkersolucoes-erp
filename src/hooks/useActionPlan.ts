import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type ActionBoard = Tables<"action_boards">;
export type ActionColumn = Tables<"action_columns">;
export type ActionCard = Tables<"action_cards">;
export type ActionCardItem = Tables<"action_card_items">;

export type ActionBoardInsert = TablesInsert<"action_boards">;
export type ActionColumnInsert = TablesInsert<"action_columns">;
export type ActionCardInsert = TablesInsert<"action_cards">;
export type ActionCardItemInsert = TablesInsert<"action_card_items">;

export const useActionPlan = () => {
  const [boards, setBoards] = useState<ActionBoard[]>([]);
  const [columns, setColumns] = useState<ActionColumn[]>([]);
  const [cards, setCards] = useState<ActionCard[]>([]);
  const [cardItems, setCardItems] = useState<ActionCardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch boards
      const { data: boardsData, error: boardsError } = await supabase
        .from('action_boards')
        .select('*')
        .order('created_at', { ascending: false });

      if (boardsError) throw boardsError;
      setBoards(boardsData || []);

      // Set first board as selected if none selected
      if (!selectedBoard && boardsData && boardsData.length > 0) {
        setSelectedBoard(boardsData[0].id);
      }

      // Fetch columns for selected board
      if (selectedBoard || (boardsData && boardsData.length > 0)) {
        const boardId = selectedBoard || boardsData[0].id;
        
        const { data: columnsData, error: columnsError } = await supabase
          .from('action_columns')
          .select('*')
          .eq('board_id', boardId)
          .order('position');

        if (columnsError) throw columnsError;
        setColumns(columnsData || []);

        // Fetch cards for columns
        if (columnsData && columnsData.length > 0) {
          const columnIds = columnsData.map(col => col.id);
          
          const { data: cardsData, error: cardsError } = await supabase
            .from('action_cards')
            .select('*')
            .in('column_id', columnIds)
            .order('position');

          if (cardsError) throw cardsError;
          setCards((cardsData || []) as ActionCard[]);

          // Fetch card items
          if (cardsData && cardsData.length > 0) {
            const cardIds = cardsData.map(card => card.id);
            
            const { data: itemsData, error: itemsError } = await supabase
              .from('action_card_items')
              .select('*')
              .in('card_id', cardIds)
              .order('position');

            if (itemsError) throw itemsError;
            setCardItems(itemsData || []);
          }
        }
      }
    } catch (error: any) {
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedBoard]);

  const createBoard = async (data: Omit<ActionBoardInsert, 'user_id'>) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }

      const { data: boardData, error } = await supabase
        .from('action_boards')
        .insert({ ...data, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      await fetchData();
      setSelectedBoard(boardData.id);
      
      toast({
        title: "Quadro criado",
        description: "Quadro criado com sucesso!",
      });
      
      return boardData;
    } catch (error: any) {
      toast({
        title: "Erro ao criar quadro",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateBoard = async (id: string, data: Partial<ActionBoard>) => {
    try {
      const { error } = await supabase
        .from('action_boards')
        .update(data)
        .eq('id', id);

      if (error) throw error;
      await fetchData();
      
      toast({
        title: "Quadro atualizado",
        description: "Quadro atualizado com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar quadro",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteBoard = async (id: string) => {
    try {
      const { error } = await supabase
        .from('action_boards')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchData();
      
      toast({
        title: "Quadro excluído",
        description: "Quadro excluído com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao excluir quadro",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const createColumn = async (data: Omit<ActionColumnInsert, 'user_id'>) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }

      const { error } = await supabase
        .from('action_columns')
        .insert({ ...data, user_id: user.id });

      if (error) throw error;
      await fetchData();
      
      toast({
        title: "Coluna criada",
        description: "Coluna criada com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao criar coluna",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateColumn = async (id: string, data: Partial<ActionColumn>) => {
    try {
      const { error } = await supabase
        .from('action_columns')
        .update(data)
        .eq('id', id);

      if (error) throw error;
      await fetchData();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar coluna",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteColumn = async (id: string) => {
    try {
      const { error } = await supabase
        .from('action_columns')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchData();
      
      toast({
        title: "Coluna excluída",
        description: "Coluna excluída com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao excluir coluna",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const createCard = async (data: ActionCardInsert) => {
    try {
      const { error } = await supabase
        .from('action_cards')
        .insert(data);

      if (error) throw error;
      await fetchData();
      
      toast({
        title: "Card criado",
        description: "Card criado com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao criar card",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateCard = async (id: string, data: Partial<ActionCard>) => {
    try {
      const { error } = await supabase
        .from('action_cards')
        .update(data)
        .eq('id', id);

      if (error) throw error;
      await fetchData();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar card",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteCard = async (id: string) => {
    try {
      const { error } = await supabase
        .from('action_cards')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchData();
      
      toast({
        title: "Card excluído",
        description: "Card excluído com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao excluir card",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const createCardItem = async (data: ActionCardItemInsert) => {
    try {
      const { error } = await supabase
        .from('action_card_items')
        .insert(data);

      if (error) throw error;
      await fetchData();
    } catch (error: any) {
      toast({
        title: "Erro ao criar item",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateCardItem = async (id: string, data: Partial<ActionCardItem>) => {
    try {
      const { error } = await supabase
        .from('action_card_items')
        .update(data)
        .eq('id', id);

      if (error) throw error;
      await fetchData();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar item",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteCardItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('action_card_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchData();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir item",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    boards,
    columns,
    cards,
    cardItems,
    isLoading,
    selectedBoard,
    setSelectedBoard,
    fetchData,
    createBoard,
    updateBoard,
    deleteBoard,
    createColumn,
    updateColumn,
    deleteColumn,
    createCard,
    updateCard,
    deleteCard,
    createCardItem,
    updateCardItem,
    deleteCardItem,
  };
};