export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      artikel: {
        Row: {
          agare: string | null
          anteckning: string | null
          artikelnummer: string | null
          fabrikat: string
          id: string
          komponentmall_id: string
          spanning_max_v: number | null
          spanning_min_v: number | null
          strom_a: number | null
        }
        Insert: {
          agare?: string | null
          anteckning?: string | null
          artikelnummer?: string | null
          fabrikat: string
          id?: string
          komponentmall_id: string
          spanning_max_v?: number | null
          spanning_min_v?: number | null
          strom_a?: number | null
        }
        Update: {
          agare?: string | null
          anteckning?: string | null
          artikelnummer?: string | null
          fabrikat?: string
          id?: string
          komponentmall_id?: string
          spanning_max_v?: number | null
          spanning_min_v?: number | null
          strom_a?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "artikel_agare_fkey"
            columns: ["agare"]
            isOneToOne: false
            referencedRelation: "profiler"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artikel_komponentmall_id_fkey"
            columns: ["komponentmall_id"]
            isOneToOne: false
            referencedRelation: "komponentmall"
            referencedColumns: ["id"]
          },
        ]
      }
      barformaga: {
        Row: {
          area_mm2: number
          awg: number | null
          id: string
          kalla: string
          thin_wall_a: number
          vanlig_a: number
        }
        Insert: {
          area_mm2: number
          awg?: number | null
          id?: string
          kalla: string
          thin_wall_a: number
          vanlig_a: number
        }
        Update: {
          area_mm2?: number
          awg?: number | null
          id?: string
          kalla?: string
          thin_wall_a?: number
          vanlig_a?: number
        }
        Relationships: []
      }
      blad: {
        Row: {
          bredd_mm: number | null
          format: string
          hojd_mm: number | null
          id: string
          namn: string
          ordning: number
          projekt_id: string
          skala: number
        }
        Insert: {
          bredd_mm?: number | null
          format?: string
          hojd_mm?: number | null
          id?: string
          namn: string
          ordning?: number
          projekt_id: string
          skala?: number
        }
        Update: {
          bredd_mm?: number | null
          format?: string
          hojd_mm?: number | null
          id?: string
          namn?: string
          ordning?: number
          projekt_id?: string
          skala?: number
        }
        Relationships: [
          {
            foreignKeyName: "blad_projekt_id_fkey"
            columns: ["projekt_id"]
            isOneToOne: false
            referencedRelation: "projekt"
            referencedColumns: ["id"]
          },
        ]
      }
      bladfilter_enhet: {
        Row: {
          blad_id: string
          enhet_id: string
        }
        Insert: {
          blad_id: string
          enhet_id: string
        }
        Update: {
          blad_id?: string
          enhet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bladfilter_enhet_blad_id_fkey"
            columns: ["blad_id"]
            isOneToOne: false
            referencedRelation: "blad"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bladfilter_enhet_enhet_id_fkey"
            columns: ["enhet_id"]
            isOneToOne: false
            referencedRelation: "enhet"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bladfilter_enhet_enhet_id_fkey"
            columns: ["enhet_id"]
            isOneToOne: false
            referencedRelation: "nod_vy"
            referencedColumns: ["enhet_id"]
          },
        ]
      }
      bladfilter_zon: {
        Row: {
          blad_id: string
          zon_id: string
        }
        Insert: {
          blad_id: string
          zon_id: string
        }
        Update: {
          blad_id?: string
          zon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bladfilter_zon_blad_id_fkey"
            columns: ["blad_id"]
            isOneToOne: false
            referencedRelation: "blad"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bladfilter_zon_zon_id_fkey"
            columns: ["zon_id"]
            isOneToOne: false
            referencedRelation: "zon"
            referencedColumns: ["id"]
          },
        ]
      }
      bladplacering: {
        Row: {
          blad_id: string
          nyckel: string
          x: number
          y: number
        }
        Insert: {
          blad_id: string
          nyckel: string
          x: number
          y: number
        }
        Update: {
          blad_id?: string
          nyckel?: string
          x?: number
          y?: number
        }
        Relationships: [
          {
            foreignKeyName: "bladplacering_blad_id_fkey"
            columns: ["blad_id"]
            isOneToOne: false
            referencedRelation: "blad"
            referencedColumns: ["id"]
          },
        ]
      }
      enhet: {
        Row: {
          beteckning: string
          enhetsmall_id: string
          id: string
          projekt_id: string
          zon_id: string | null
        }
        Insert: {
          beteckning: string
          enhetsmall_id: string
          id?: string
          projekt_id: string
          zon_id?: string | null
        }
        Update: {
          beteckning?: string
          enhetsmall_id?: string
          id?: string
          projekt_id?: string
          zon_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enhet_enhetsmall_id_fkey"
            columns: ["enhetsmall_id"]
            isOneToOne: false
            referencedRelation: "enhetsmall"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enhet_projekt_id_fkey"
            columns: ["projekt_id"]
            isOneToOne: false
            referencedRelation: "projekt"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enhet_zon_id_fkey"
            columns: ["zon_id"]
            isOneToOne: false
            referencedRelation: "zon"
            referencedColumns: ["id"]
          },
        ]
      }
      enhetsmall: {
        Row: {
          agare: string | null
          anteckning: string | null
          can_terminerad: boolean
          fabrikat: string
          id: string
          max_strom_a: number | null
          modell: string
          typ: Database["public"]["Enums"]["enhetstyp"]
        }
        Insert: {
          agare?: string | null
          anteckning?: string | null
          can_terminerad?: boolean
          fabrikat: string
          id?: string
          max_strom_a?: number | null
          modell: string
          typ: Database["public"]["Enums"]["enhetstyp"]
        }
        Update: {
          agare?: string | null
          anteckning?: string | null
          can_terminerad?: boolean
          fabrikat?: string
          id?: string
          max_strom_a?: number | null
          modell?: string
          typ?: Database["public"]["Enums"]["enhetstyp"]
        }
        Relationships: [
          {
            foreignKeyName: "enhetsmall_agare_fkey"
            columns: ["agare"]
            isOneToOne: false
            referencedRelation: "profiler"
            referencedColumns: ["id"]
          },
        ]
      }
      inbjudningskod: {
        Row: {
          anvand: string | null
          anvand_av: string | null
          kod: string
          skapad: string
          skapad_av: string | null
        }
        Insert: {
          anvand?: string | null
          anvand_av?: string | null
          kod: string
          skapad?: string
          skapad_av?: string | null
        }
        Update: {
          anvand?: string | null
          anvand_av?: string | null
          kod?: string
          skapad?: string
          skapad_av?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inbjudningskod_anvand_av_fkey"
            columns: ["anvand_av"]
            isOneToOne: true
            referencedRelation: "profiler"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inbjudningskod_skapad_av_fkey"
            columns: ["skapad_av"]
            isOneToOne: false
            referencedRelation: "profiler"
            referencedColumns: ["id"]
          },
        ]
      }
      jordpunkt: {
        Row: {
          beteckning: string
          enhet_id: string | null
          id: string
          klass: Database["public"]["Enums"]["jordklass"]
          projekt_id: string
          zon_id: string | null
        }
        Insert: {
          beteckning: string
          enhet_id?: string | null
          id?: string
          klass: Database["public"]["Enums"]["jordklass"]
          projekt_id: string
          zon_id?: string | null
        }
        Update: {
          beteckning?: string
          enhet_id?: string | null
          id?: string
          klass?: Database["public"]["Enums"]["jordklass"]
          projekt_id?: string
          zon_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jordpunkt_enhet_id_fkey"
            columns: ["enhet_id"]
            isOneToOne: false
            referencedRelation: "enhet"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jordpunkt_enhet_id_fkey"
            columns: ["enhet_id"]
            isOneToOne: false
            referencedRelation: "nod_vy"
            referencedColumns: ["enhet_id"]
          },
          {
            foreignKeyName: "jordpunkt_projekt_id_fkey"
            columns: ["projekt_id"]
            isOneToOne: false
            referencedRelation: "projekt"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jordpunkt_zon_id_fkey"
            columns: ["zon_id"]
            isOneToOne: false
            referencedRelation: "zon"
            referencedColumns: ["id"]
          },
        ]
      }
      kabel: {
        Row: {
          area_mm2: number | null
          farg: string | null
          id: string
          langd_mm: number | null
          markning: string | null
          nod_a: string
          nod_b: string
          projekt_id: string
          skarmad: boolean
          typ: Database["public"]["Enums"]["kabeltyp"] | null
        }
        Insert: {
          area_mm2?: number | null
          farg?: string | null
          id?: string
          langd_mm?: number | null
          markning?: string | null
          nod_a: string
          nod_b: string
          projekt_id: string
          skarmad?: boolean
          typ?: Database["public"]["Enums"]["kabeltyp"] | null
        }
        Update: {
          area_mm2?: number | null
          farg?: string | null
          id?: string
          langd_mm?: number | null
          markning?: string | null
          nod_a?: string
          nod_b?: string
          projekt_id?: string
          skarmad?: boolean
          typ?: Database["public"]["Enums"]["kabeltyp"] | null
        }
        Relationships: [
          {
            foreignKeyName: "kabel_nod_a_fkey"
            columns: ["nod_a"]
            isOneToOne: false
            referencedRelation: "nod"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kabel_nod_a_fkey"
            columns: ["nod_a"]
            isOneToOne: false
            referencedRelation: "nod_vy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kabel_nod_b_fkey"
            columns: ["nod_b"]
            isOneToOne: false
            referencedRelation: "nod"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kabel_nod_b_fkey"
            columns: ["nod_b"]
            isOneToOne: false
            referencedRelation: "nod_vy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kabel_projekt_id_fkey"
            columns: ["projekt_id"]
            isOneToOne: false
            referencedRelation: "projekt"
            referencedColumns: ["id"]
          },
        ]
      }
      komponent: {
        Row: {
          artikel_id: string | null
          beteckning: string
          id: string
          komponentmall_id: string
          nummer: number | null
          projekt_id: string
          zon_id: string | null
        }
        Insert: {
          artikel_id?: string | null
          beteckning: string
          id?: string
          komponentmall_id: string
          nummer?: number | null
          projekt_id: string
          zon_id?: string | null
        }
        Update: {
          artikel_id?: string | null
          beteckning?: string
          id?: string
          komponentmall_id?: string
          nummer?: number | null
          projekt_id?: string
          zon_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "komponent_artikel_id_fkey"
            columns: ["artikel_id"]
            isOneToOne: false
            referencedRelation: "artikel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "komponent_komponentmall_id_fkey"
            columns: ["komponentmall_id"]
            isOneToOne: false
            referencedRelation: "komponentmall"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "komponent_projekt_id_fkey"
            columns: ["projekt_id"]
            isOneToOne: false
            referencedRelation: "projekt"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "komponent_zon_id_fkey"
            columns: ["zon_id"]
            isOneToOne: false
            referencedRelation: "zon"
            referencedColumns: ["id"]
          },
        ]
      }
      komponentanslutning: {
        Row: {
          anslutningsmall_id: string
          id: string
          komponent_id: string
        }
        Insert: {
          anslutningsmall_id: string
          id?: string
          komponent_id: string
        }
        Update: {
          anslutningsmall_id?: string
          id?: string
          komponent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "komponentanslutning_anslutningsmall_id_fkey"
            columns: ["anslutningsmall_id"]
            isOneToOne: false
            referencedRelation: "komponentanslutningsmall"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "komponentanslutning_komponent_id_fkey"
            columns: ["komponent_id"]
            isOneToOne: false
            referencedRelation: "komponent"
            referencedColumns: ["id"]
          },
        ]
      }
      komponentanslutningsmall: {
        Row: {
          beteckning: string
          funktion: string
          id: string
          komponentmall_id: string
          signaltyp_id: string | null
        }
        Insert: {
          beteckning: string
          funktion: string
          id?: string
          komponentmall_id: string
          signaltyp_id?: string | null
        }
        Update: {
          beteckning?: string
          funktion?: string
          id?: string
          komponentmall_id?: string
          signaltyp_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "komponentanslutningsmall_komponentmall_id_fkey"
            columns: ["komponentmall_id"]
            isOneToOne: false
            referencedRelation: "komponentmall"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "komponentanslutningsmall_signaltyp_id_fkey"
            columns: ["signaltyp_id"]
            isOneToOne: false
            referencedRelation: "signaltyp"
            referencedColumns: ["id"]
          },
        ]
      }
      komponentmall: {
        Row: {
          agare: string | null
          id: string
          kategori: string
          namn: string
        }
        Insert: {
          agare?: string | null
          id?: string
          kategori: string
          namn: string
        }
        Update: {
          agare?: string | null
          id?: string
          kategori?: string
          namn?: string
        }
        Relationships: [
          {
            foreignKeyName: "komponentmall_agare_fkey"
            columns: ["agare"]
            isOneToOne: false
            referencedRelation: "profiler"
            referencedColumns: ["id"]
          },
        ]
      }
      kontaktdonsmall: {
        Row: {
          beteckning: string
          enhetsmall_id: string
          id: string
          poler: number
        }
        Insert: {
          beteckning: string
          enhetsmall_id: string
          id?: string
          poler: number
        }
        Update: {
          beteckning?: string
          enhetsmall_id?: string
          id?: string
          poler?: number
        }
        Relationships: [
          {
            foreignKeyName: "kontaktdonsmall_enhetsmall_id_fkey"
            columns: ["enhetsmall_id"]
            isOneToOne: false
            referencedRelation: "enhetsmall"
            referencedColumns: ["id"]
          },
        ]
      }
      nod: {
        Row: {
          id: string
          jordpunkt_id: string | null
          komponentanslutning_id: string | null
          port_id: string | null
          projekt_id: string
          skarvpunkt_id: string | null
        }
        Insert: {
          id?: string
          jordpunkt_id?: string | null
          komponentanslutning_id?: string | null
          port_id?: string | null
          projekt_id: string
          skarvpunkt_id?: string | null
        }
        Update: {
          id?: string
          jordpunkt_id?: string | null
          komponentanslutning_id?: string | null
          port_id?: string | null
          projekt_id?: string
          skarvpunkt_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nod_jordpunkt_id_fkey"
            columns: ["jordpunkt_id"]
            isOneToOne: true
            referencedRelation: "jordpunkt"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nod_komponentanslutning_id_fkey"
            columns: ["komponentanslutning_id"]
            isOneToOne: true
            referencedRelation: "komponentanslutning"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nod_komponentanslutning_id_fkey"
            columns: ["komponentanslutning_id"]
            isOneToOne: true
            referencedRelation: "nod_vy"
            referencedColumns: ["komponentanslutning_id"]
          },
          {
            foreignKeyName: "nod_port_id_fkey"
            columns: ["port_id"]
            isOneToOne: true
            referencedRelation: "port"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nod_projekt_id_fkey"
            columns: ["projekt_id"]
            isOneToOne: false
            referencedRelation: "projekt"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nod_skarvpunkt_id_fkey"
            columns: ["skarvpunkt_id"]
            isOneToOne: true
            referencedRelation: "skarvpunkt"
            referencedColumns: ["id"]
          },
        ]
      }
      port: {
        Row: {
          enhet_id: string
          id: string
          portmall_id: string
          vald_roll_id: string | null
        }
        Insert: {
          enhet_id: string
          id?: string
          portmall_id: string
          vald_roll_id?: string | null
        }
        Update: {
          enhet_id?: string
          id?: string
          portmall_id?: string
          vald_roll_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "port_enhet_id_fkey"
            columns: ["enhet_id"]
            isOneToOne: false
            referencedRelation: "enhet"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "port_enhet_id_fkey"
            columns: ["enhet_id"]
            isOneToOne: false
            referencedRelation: "nod_vy"
            referencedColumns: ["enhet_id"]
          },
          {
            foreignKeyName: "port_portmall_id_fkey"
            columns: ["portmall_id"]
            isOneToOne: false
            referencedRelation: "portmall"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "port_vald_roll_id_fkey"
            columns: ["vald_roll_id"]
            isOneToOne: false
            referencedRelation: "portroll"
            referencedColumns: ["id"]
          },
        ]
      }
      portmall: {
        Row: {
          anteckning: string | null
          beteckning: string
          enhetsmall_id: string
          id: string
          max_strom_a: number | null
          riktning: Database["public"]["Enums"]["riktning"]
        }
        Insert: {
          anteckning?: string | null
          beteckning: string
          enhetsmall_id: string
          id?: string
          max_strom_a?: number | null
          riktning: Database["public"]["Enums"]["riktning"]
        }
        Update: {
          anteckning?: string | null
          beteckning?: string
          enhetsmall_id?: string
          id?: string
          max_strom_a?: number | null
          riktning?: Database["public"]["Enums"]["riktning"]
        }
        Relationships: [
          {
            foreignKeyName: "portmall_enhetsmall_id_fkey"
            columns: ["enhetsmall_id"]
            isOneToOne: false
            referencedRelation: "enhetsmall"
            referencedColumns: ["id"]
          },
        ]
      }
      portroll: {
        Row: {
          ar_standard: boolean
          id: string
          portmall_id: string
          signaltyp_id: string
        }
        Insert: {
          ar_standard?: boolean
          id?: string
          portmall_id: string
          signaltyp_id: string
        }
        Update: {
          ar_standard?: boolean
          id?: string
          portmall_id?: string
          signaltyp_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portroll_portmall_id_fkey"
            columns: ["portmall_id"]
            isOneToOne: false
            referencedRelation: "portmall"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portroll_signaltyp_id_fkey"
            columns: ["signaltyp_id"]
            isOneToOne: false
            referencedRelation: "signaltyp"
            referencedColumns: ["id"]
          },
        ]
      }
      portstift: {
        Row: {
          portmall_id: string
          stiftmall_id: string
        }
        Insert: {
          portmall_id: string
          stiftmall_id: string
        }
        Update: {
          portmall_id?: string
          stiftmall_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portstift_portmall_id_fkey"
            columns: ["portmall_id"]
            isOneToOne: false
            referencedRelation: "portmall"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portstift_stiftmall_id_fkey"
            columns: ["stiftmall_id"]
            isOneToOne: false
            referencedRelation: "stiftmall"
            referencedColumns: ["id"]
          },
        ]
      }
      profiler: {
        Row: {
          id: string
          namn: string
          skapad: string
        }
        Insert: {
          id: string
          namn: string
          skapad?: string
        }
        Update: {
          id?: string
          namn?: string
          skapad?: string
        }
        Relationships: []
      }
      projekt: {
        Row: {
          agare: string
          andrad: string
          fordon: string | null
          id: string
          namn: string
          skapad: string
        }
        Insert: {
          agare: string
          andrad?: string
          fordon?: string | null
          id?: string
          namn: string
          skapad?: string
        }
        Update: {
          agare?: string
          andrad?: string
          fordon?: string | null
          id?: string
          namn?: string
          skapad?: string
        }
        Relationships: [
          {
            foreignKeyName: "projekt_agare_fkey"
            columns: ["agare"]
            isOneToOne: false
            referencedRelation: "profiler"
            referencedColumns: ["id"]
          },
        ]
      }
      signaltyp: {
        Row: {
          agare: string | null
          ar_karna: boolean
          id: string
          kategori: Database["public"]["Enums"]["signalkategori"]
          namn: string
          nyckel: string
        }
        Insert: {
          agare?: string | null
          ar_karna?: boolean
          id?: string
          kategori: Database["public"]["Enums"]["signalkategori"]
          namn: string
          nyckel: string
        }
        Update: {
          agare?: string | null
          ar_karna?: boolean
          id?: string
          kategori?: Database["public"]["Enums"]["signalkategori"]
          namn?: string
          nyckel?: string
        }
        Relationships: [
          {
            foreignKeyName: "signaltyp_agare_fkey"
            columns: ["agare"]
            isOneToOne: false
            referencedRelation: "profiler"
            referencedColumns: ["id"]
          },
        ]
      }
      skarvpunkt: {
        Row: {
          beteckning: string
          id: string
          projekt_id: string
          zon_id: string | null
        }
        Insert: {
          beteckning: string
          id?: string
          projekt_id: string
          zon_id?: string | null
        }
        Update: {
          beteckning?: string
          id?: string
          projekt_id?: string
          zon_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skarvpunkt_projekt_id_fkey"
            columns: ["projekt_id"]
            isOneToOne: false
            referencedRelation: "projekt"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skarvpunkt_zon_id_fkey"
            columns: ["zon_id"]
            isOneToOne: false
            referencedRelation: "zon"
            referencedColumns: ["id"]
          },
        ]
      }
      stiftmall: {
        Row: {
          id: string
          kontaktdonsmall_id: string
          max_strom_a: number | null
          position: string
          storlek: string | null
        }
        Insert: {
          id?: string
          kontaktdonsmall_id: string
          max_strom_a?: number | null
          position: string
          storlek?: string | null
        }
        Update: {
          id?: string
          kontaktdonsmall_id?: string
          max_strom_a?: number | null
          position?: string
          storlek?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stiftmall_kontaktdonsmall_id_fkey"
            columns: ["kontaktdonsmall_id"]
            isOneToOne: false
            referencedRelation: "kontaktdonsmall"
            referencedColumns: ["id"]
          },
        ]
      }
      zon: {
        Row: {
          id: string
          namn: string
          ordning: number
          projekt_id: string
        }
        Insert: {
          id?: string
          namn: string
          ordning?: number
          projekt_id: string
        }
        Update: {
          id?: string
          namn?: string
          ordning?: number
          projekt_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zon_projekt_id_fkey"
            columns: ["projekt_id"]
            isOneToOne: false
            referencedRelation: "projekt"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      kabel_vy: {
        Row: {
          area_mm2: number | null
          farg: string | null
          fran_anslutning: string | null
          fran_bararen: string | null
          fran_signaltyp: string | null
          fran_sort: string | null
          id: string | null
          langd_mm: number | null
          last_a: number | null
          markning: string | null
          nod_a: string | null
          nod_b: string | null
          projekt_id: string | null
          skarmad: boolean | null
          till_anslutning: string | null
          till_bararen: string | null
          till_signaltyp: string | null
          till_sort: string | null
          typ: Database["public"]["Enums"]["kabeltyp"] | null
          zon_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kabel_nod_a_fkey"
            columns: ["nod_a"]
            isOneToOne: false
            referencedRelation: "nod"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kabel_nod_a_fkey"
            columns: ["nod_a"]
            isOneToOne: false
            referencedRelation: "nod_vy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kabel_nod_b_fkey"
            columns: ["nod_b"]
            isOneToOne: false
            referencedRelation: "nod"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kabel_nod_b_fkey"
            columns: ["nod_b"]
            isOneToOne: false
            referencedRelation: "nod_vy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kabel_projekt_id_fkey"
            columns: ["projekt_id"]
            isOneToOne: false
            referencedRelation: "projekt"
            referencedColumns: ["id"]
          },
        ]
      }
      nod_vy: {
        Row: {
          anslutning: string | null
          bararen: string | null
          enhet_id: string | null
          id: string | null
          jord_enhet_id: string | null
          jordklass: Database["public"]["Enums"]["jordklass"] | null
          jordpunkt_id: string | null
          komponentanslutning_id: string | null
          last_a: number | null
          max_strom_a: number | null
          port_id: string | null
          projekt_id: string | null
          riktning: Database["public"]["Enums"]["riktning"] | null
          signaltyp: string | null
          signaltyp_namn: string | null
          skarvpunkt_id: string | null
          sort: string | null
          zon_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jordpunkt_enhet_id_fkey"
            columns: ["jord_enhet_id"]
            isOneToOne: false
            referencedRelation: "enhet"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jordpunkt_enhet_id_fkey"
            columns: ["jord_enhet_id"]
            isOneToOne: false
            referencedRelation: "nod_vy"
            referencedColumns: ["enhet_id"]
          },
          {
            foreignKeyName: "nod_jordpunkt_id_fkey"
            columns: ["jordpunkt_id"]
            isOneToOne: true
            referencedRelation: "jordpunkt"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nod_port_id_fkey"
            columns: ["port_id"]
            isOneToOne: true
            referencedRelation: "port"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nod_projekt_id_fkey"
            columns: ["projekt_id"]
            isOneToOne: false
            referencedRelation: "projekt"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nod_skarvpunkt_id_fkey"
            columns: ["skarvpunkt_id"]
            isOneToOne: true
            referencedRelation: "skarvpunkt"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      agare_av_enhetsmall: { Args: { m: string }; Returns: string }
      agare_av_komponentmall: { Args: { m: string }; Returns: string }
      agare_via_kontaktdonsmall: { Args: { k: string }; Returns: string }
      agare_via_portmall: { Args: { p: string }; Returns: string }
      ager_bibliotekspost: { Args: { a: string }; Returns: boolean }
      ager_projekt: { Args: { p: string }; Returns: boolean }
      foreslagen_area: {
        Args: { sort: Database["public"]["Enums"]["kabeltyp"]; strom: number }
        Returns: number
      }
      projekt_for_blad: { Args: { b: string }; Returns: string }
      projekt_for_enhet: { Args: { e: string }; Returns: string }
      projekt_for_komponent: { Args: { k: string }; Returns: string }
      ser_bibliotekspost: { Args: { a: string }; Returns: boolean }
    }
    Enums: {
      enhetstyp: "styrenhet" | "pdm" | "exp"
      jordklass: "sensor" | "vr" | "skarm" | "chassi"
      kabeltyp: "thin_wall" | "vanlig"
      riktning: "in" | "ut" | "dubbelriktad" | "matning" | "jord"
      signalkategori: "jord" | "matning" | "ingang" | "utgang" | "buss"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      enhetstyp: ["styrenhet", "pdm", "exp"],
      jordklass: ["sensor", "vr", "skarm", "chassi"],
      kabeltyp: ["thin_wall", "vanlig"],
      riktning: ["in", "ut", "dubbelriktad", "matning", "jord"],
      signalkategori: ["jord", "matning", "ingang", "utgang", "buss"],
    },
  },
} as const

