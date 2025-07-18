import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, Image as ImageIcon, X } from 'lucide-react';

export const BrandingSettingsPanel = () => {
  const { data: settings, refetch } = useSystemSettings();
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const companyName = settings?.find(s => s.setting_key === 'company_name')?.setting_value || 'Sistema de Gestão de TI';
  const logoUrl = settings?.find(s => s.setting_key === 'company_logo_url')?.setting_value || '';

  const validateFile = (file: File): string | null => {
    // Verificar tipo de arquivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return 'Tipo de arquivo não suportado. Use JPG, PNG, SVG ou WebP.';
    }

    // Verificar tamanho (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return 'Arquivo muito grande. Tamanho máximo: 5MB.';
    }

    // Verificar dimensões mínimas/máximas
    return new Promise<string | null>((resolve) => {
      const img = new Image();
      img.onload = () => {
        if (img.width < 50 || img.height < 50) {
          resolve('Imagem muito pequena. Tamanho mínimo: 50x50 pixels.');
        } else if (img.width > 2000 || img.height > 2000) {
          resolve('Imagem muito grande. Tamanho máximo: 2000x2000 pixels.');
        } else {
          resolve(null);
        }
      };
      img.onerror = () => resolve('Arquivo de imagem inválido.');
      img.src = URL.createObjectURL(file);
    }) as any;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = await validateFile(file);
    if (validationError) {
      toast({
        title: "Arquivo inválido",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    // Criar preview
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);
  };

  const handleUpload = async () => {
    if (!fileInputRef.current?.files?.[0]) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Selecione uma imagem primeiro.",
        variant: "destructive",
      });
      return;
    }

    const file = fileInputRef.current.files[0];
    setUploading(true);

    try {
      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      // Upload do arquivo
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('company-assets')
        .upload(filePath, file, {
          upsert: true,
          cacheControl: '3600'
        });

      if (uploadError) {
        throw uploadError;
      }

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('company-assets')
        .getPublicUrl(filePath);

      if (!urlData.publicUrl) {
        throw new Error('Erro ao obter URL da imagem');
      }

      // Remover logo antiga se existir
      if (logoUrl) {
        const oldPath = logoUrl.split('/company-assets/')[1];
        if (oldPath) {
          await supabase.storage
            .from('company-assets')
            .remove([oldPath]);
        }
      }

      // Salvar URL nas configurações
      const logoSetting = settings?.find(s => s.setting_key === 'company_logo_url');
      if (logoSetting) {
        const { error: updateError } = await supabase
          .from('system_settings')
          .update({ setting_value: urlData.publicUrl })
          .eq('id', logoSetting.id);
        
        if (updateError) throw updateError;
      } else {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) throw new Error('Usuário não autenticado');
        
        const { error: insertError } = await supabase
          .from('system_settings')
          .insert({
            user_id: userData.user.id,
            setting_key: 'company_logo_url',
            setting_value: urlData.publicUrl,
            category: 'branding',
            setting_type: 'text',
            description: 'URL da logo da empresa exibida no sistema'
          });
          
        if (insertError) throw insertError;
      }

      // Refetch para atualizar a UI
      refetch();

      toast({
        title: "Logo atualizada!",
        description: "A logo da empresa foi atualizada com sucesso.",
      });

      // Limpar preview e input
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error: any) {
      console.error('Erro no upload:', error);
      toast({
        title: "Erro no upload",
        description: error.message || "Erro ao fazer upload da logo.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!logoUrl) return;

    try {
      // Remover arquivo do storage
      const oldPath = logoUrl.split('/company-assets/')[1];
      if (oldPath) {
        await supabase.storage
          .from('company-assets')
          .remove([oldPath]);
      }

      // Atualizar configuração
      const logoSetting = settings?.find(s => s.setting_key === 'company_logo_url');
      if (logoSetting) {
        const { error: updateError } = await supabase
          .from('system_settings')
          .update({ setting_value: '' })
          .eq('id', logoSetting.id);
          
        if (updateError) throw updateError;
      }

      // Refetch para atualizar a UI
      refetch();

      toast({
        title: "Logo removida",
        description: "A logo da empresa foi removida com sucesso.",
      });

    } catch (error: any) {
      toast({
        title: "Erro ao remover logo",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateCompanyName = async (newName: string) => {
    const nameSetting = settings?.find(s => s.setting_key === 'company_name');
    try {
      if (nameSetting) {
        const { error: updateError } = await supabase
          .from('system_settings')
          .update({ setting_value: newName })
          .eq('id', nameSetting.id);
          
        if (updateError) throw updateError;
      } else {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) throw new Error('Usuário não autenticado');
        
        const { error: insertError } = await supabase
          .from('system_settings')
          .insert({
            user_id: userData.user.id,
            setting_key: 'company_name',
            setting_value: newName,
            category: 'branding',
            setting_type: 'text',
            description: 'Nome da empresa exibido no sistema'
          });
          
        if (insertError) throw insertError;
      }

      // Refetch para atualizar a UI
      refetch();

      toast({
        title: "Nome atualizado!",
        description: "O nome da empresa foi atualizado com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar nome",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const clearPreview = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Configurações de Marca
        </CardTitle>
        <CardDescription>
          Configure a logo e nome da sua empresa no sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Nome da Empresa */}
        <div className="space-y-2">
          <Label htmlFor="company_name">Nome da Empresa</Label>
          <div className="flex gap-2">
            <Input
              id="company_name"
              defaultValue={companyName}
              placeholder="Nome da sua empresa"
              onBlur={(e) => {
                if (e.target.value !== companyName) {
                  updateCompanyName(e.target.value);
                }
              }}
            />
          </div>
        </div>

        {/* Logo Atual */}
        {logoUrl && (
          <div className="space-y-2">
            <Label>Logo Atual</Label>
            <div className="flex items-center gap-4">
              <div className="border rounded-lg p-4 bg-gray-50">
                <img 
                  src={logoUrl} 
                  alt="Logo da empresa" 
                  className="max-h-16 max-w-32 object-contain"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveLogo}
                className="text-destructive hover:text-destructive"
              >
                <X className="h-4 w-4 mr-1" />
                Remover
              </Button>
            </div>
          </div>
        )}

        {/* Upload de Nova Logo */}
        <div className="space-y-4">
          <Label>Nova Logo</Label>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/svg+xml,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {previewUrl ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="max-h-32 max-w-64 object-contain border rounded"
                  />
                </div>
                <div className="flex gap-2 justify-center">
                  <Button 
                    onClick={handleUpload} 
                    disabled={uploading}
                    size="sm"
                  >
                    {uploading ? (
                      <>
                        <Upload className="h-4 w-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Confirmar Upload
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={clearPreview}
                    size="sm"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <ImageIcon className="h-12 w-12 mx-auto text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Clique para selecionar uma imagem
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Selecionar Arquivo
                  </Button>
                </div>
                <div className="text-xs text-gray-500">
                  <p>Formatos aceitos: JPG, PNG, SVG, WebP</p>
                  <p>Tamanho máximo: 5MB | Dimensões: 50x50 a 2000x2000 pixels</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Instruções */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Dicas para melhor resultado:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Use imagens com fundo transparente (PNG ou SVG)</li>
            <li>• Mantenha proporção quadrada ou retangular</li>
            <li>• Evite imagens muito detalhadas em tamanhos pequenos</li>
            <li>• Teste a visualização em diferentes tamanhos de tela</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};