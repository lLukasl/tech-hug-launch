export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      cash_sessions: {
        Row: {
          aberto_em: string
          aberto_por: string | null
          data: string
          dinheiro_contado: number | null
          fechado_em: string | null
          fechado_por: string | null
          foto_maquininha: string | null
          id: string
          loja: string
          observacoes: string | null
          status: string
          troco_inicial: number
        }
        Insert: {
          aberto_em?: string
          aberto_por?: string | null
          data?: string
          dinheiro_contado?: number | null
          fechado_em?: string | null
          fechado_por?: string | null
          foto_maquininha?: string | null
          id?: string
          loja: string
          observacoes?: string | null
          status?: string
          troco_inicial?: number
        }
        Update: {
          aberto_em?: string
          aberto_por?: string | null
          data?: string
          dinheiro_contado?: number | null
          fechado_em?: string | null
          fechado_por?: string | null
          foto_maquininha?: string | null
          id?: string
          loja?: string
          observacoes?: string | null
          status?: string
          troco_inicial?: number
        }
        Relationships: []
      }
      cash_withdrawals: {
        Row: {
          created_at: string
          criado_por: string
          criado_por_email: string | null
          id: string
          motivo: string
          session_id: string
          valor: number
        }
        Insert: {
          created_at?: string
          criado_por: string
          criado_por_email?: string | null
          id?: string
          motivo: string
          session_id: string
          valor: number
        }
        Update: {
          created_at?: string
          criado_por?: string
          criado_por_email?: string | null
          id?: string
          motivo?: string
          session_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "cash_withdrawals_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "cash_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          armazenamento: string | null
          bateria: number | null
          categoria: string
          compativel: string | null
          condicao: string | null
          cor: string | null
          criado_em: string
          fotos: string[]
          id: string
          marca: string | null
          modelo: string | null
          nome: string
          preco: number
          status: string
        }
        Insert: {
          armazenamento?: string | null
          bateria?: number | null
          categoria: string
          compativel?: string | null
          condicao?: string | null
          cor?: string | null
          criado_em?: string
          fotos?: string[]
          id?: string
          marca?: string | null
          modelo?: string | null
          nome: string
          preco: number
          status?: string
        }
        Update: {
          armazenamento?: string | null
          bateria?: number | null
          categoria?: string
          compativel?: string | null
          condicao?: string | null
          cor?: string | null
          criado_em?: string
          fotos?: string[]
          id?: string
          marca?: string | null
          modelo?: string | null
          nome?: string
          preco?: number
          status?: string
        }
        Relationships: []
      }
      sales: {
        Row: {
          cliente_nome: string | null
          cliente_telefone: string | null
          created_at: string
          descricao: string
          id: string
          itens: Json
          loja: string
          numero: number
          origem: string
          pagamentos: Json
          product_id: string | null
          service_order_id: string | null
          session_id: string
          total: number
          vendedor_email: string | null
          vendedor_id: string
        }
        Insert: {
          cliente_nome?: string | null
          cliente_telefone?: string | null
          created_at?: string
          descricao: string
          id?: string
          itens?: Json
          loja: string
          numero?: number
          origem?: string
          pagamentos?: Json
          product_id?: string | null
          service_order_id?: string | null
          session_id: string
          total?: number
          vendedor_email?: string | null
          vendedor_id: string
        }
        Update: {
          cliente_nome?: string | null
          cliente_telefone?: string | null
          created_at?: string
          descricao?: string
          id?: string
          itens?: Json
          loja?: string
          numero?: number
          origem?: string
          pagamentos?: Json
          product_id?: string | null
          service_order_id?: string | null
          session_id?: string
          total?: number
          vendedor_email?: string | null
          vendedor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "cash_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      service_orders: {
        Row: {
          assinatura_cliente: string | null
          assinatura_loja: string | null
          cancel_motivo: string | null
          cancel_obs: string | null
          cancelado_em: string | null
          cancelado_por: string | null
          cancelado_por_email: string | null
          ciente_termos: boolean
          cliente_nome: string
          cliente_telefone: string
          cor: string | null
          created_at: string
          criado_por: string | null
          defeito: string | null
          garantia_dias: number
          id: string
          itens: Json
          loja: string
          marca: string | null
          modelo: string | null
          nao_deixou: string[]
          numero: number
          observacoes: string | null
          quantidade: number
          status: string
          termos_garantia: string | null
          tipo_aparelho: string
        }
        Insert: {
          assinatura_cliente?: string | null
          assinatura_loja?: string | null
          cancel_motivo?: string | null
          cancel_obs?: string | null
          cancelado_em?: string | null
          cancelado_por?: string | null
          cancelado_por_email?: string | null
          ciente_termos?: boolean
          cliente_nome: string
          cliente_telefone: string
          cor?: string | null
          created_at?: string
          criado_por?: string | null
          defeito?: string | null
          garantia_dias?: number
          id?: string
          itens?: Json
          loja: string
          marca?: string | null
          modelo?: string | null
          nao_deixou?: string[]
          numero?: number
          observacoes?: string | null
          quantidade?: number
          status?: string
          termos_garantia?: string | null
          tipo_aparelho?: string
        }
        Update: {
          assinatura_cliente?: string | null
          assinatura_loja?: string | null
          cancel_motivo?: string | null
          cancel_obs?: string | null
          cancelado_em?: string | null
          cancelado_por?: string | null
          cancelado_por_email?: string | null
          ciente_termos?: boolean
          cliente_nome?: string
          cliente_telefone?: string
          cor?: string | null
          created_at?: string
          criado_por?: string | null
          defeito?: string | null
          garantia_dias?: number
          id?: string
          itens?: Json
          loja?: string
          marca?: string | null
          modelo?: string | null
          nao_deixou?: string[]
          numero?: number
          observacoes?: string | null
          quantidade?: number
          status?: string
          termos_garantia?: string | null
          tipo_aparelho?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          active: boolean
          created_at: string
          email: string | null
          id: string
          loja: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          email?: string | null
          id?: string
          loja?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string | null
          id?: string
          loja?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_manage_loja: {
        Args: { _loja: string; _user_id: string }
        Returns: boolean
      }
      can_sell_loja: {
        Args: { _loja: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_global: { Args: { _user_id: string }; Returns: boolean }
      is_manager: { Args: { _user_id: string }; Returns: boolean }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      session_totals: { Args: { _session_id: string }; Returns: Json }
      user_loja: { Args: { _user_id: string }; Returns: string }
    }
    Enums: {
      app_role: "superadmin" | "member" | "gerente" | "supervisor"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["superadmin", "member", "gerente", "supervisor"],
    },
  },
} as const
