export type CategoriaAviso =
  | 'Informática'
  | 'Administração'
  | 'Grêmio Estudantil'
  | 'Secretaria'
  | 'Eventos'
  | 'Avisos Gerais';

export const CATEGORIAS_AVISO: CategoriaAviso[] = [
  'Informática',
  'Administração',
  'Grêmio Estudantil',
  'Secretaria',
  'Eventos',
  'Avisos Gerais'
];

export interface Aviso {
  id: string;
  titulo: string;
  conteudo: string;
  categoria: CategoriaAviso;
  fixado: boolean;
  criadoEm: number;
}