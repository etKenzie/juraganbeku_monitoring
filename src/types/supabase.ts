export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: string;
          // Add other profile fields here if needed
        };
        Insert: {
          id: string;
          role: string;
        };
        Update: {
          id?: string;
          role?: string;
        };
      };
      [key: string]: any;
    };
    Views: {
      [key: string]: any;
    };
    Functions: {
      [key: string]: any;
    };
    Enums: {
      [key: string]: any;
    };
  };
}; 