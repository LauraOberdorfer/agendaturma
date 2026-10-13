import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Aviso {
  id: number;
  titulo: string;
  fixado: boolean;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  avisos: Aviso[] = [
    { id: 1, titulo: 'Prova adiada', fixado: true },
    { id: 2, titulo: 'Lista 3 no Moodle', fixado: false },
    { id: 3, titulo: 'Reunião de pais', fixado: false },
    { id: 4, titulo: 'Doação de sangue', fixado: true },
    { id: 5, titulo: 'Saída antecipada', fixado: false }
  ];

  mensagem = '';
  novoTitulo = '';
  avisoArrastado: number | null = null;

  ngOnInit(): void {
    try {
      const dados = localStorage.getItem('mural-avisos');

      if (dados) {
        const lista: unknown = JSON.parse(dados);

        if (Array.isArray(lista)) {
          this.avisos = lista.filter(
            (item: unknown): item is Aviso => {
              if (typeof item !== 'object' || item === null) {
                return false;
              }

              const aviso = item as Record<string, unknown>;

              return (
                typeof aviso['id'] === 'number' &&
                typeof aviso['titulo'] === 'string' &&
                typeof aviso['fixado'] === 'boolean'
              );
            }
          ).map((aviso) => ({ ...aviso }));

          let totalFixados = 0;

          for (const aviso of this.avisos) {
            if (aviso.fixado && ++totalFixados > 2) {
              aviso.fixado = false;
            }
          }
        }
      }
    } catch {
      this.mensagem = 'Não foi possível recuperar os avisos salvos.';
    }

    this.salvar();
  }

  trackById(_index: number, aviso: Aviso): number {
    return aviso.id;
  }

  get avisosFixados(): Aviso[] {
    return this.avisos.filter((aviso) => aviso.fixado);
  }

  get limiteAtingido(): boolean {
    return this.avisosFixados.length >= 2;
  }

  fixar(id: number): void {
    const aviso = this.avisos.find((item) => item.id === id);

    if (!aviso) return;

    if (aviso.fixado) {
      aviso.fixado = false;
      this.mensagem = '';
      this.salvar();
      return;
    }

    if (this.limiteAtingido) {
      this.mensagem = 'Desafixe um aviso para fixar outro.';
      return;
    }

    aviso.fixado = true;
    this.mensagem = '';
    this.salvar();
  }

  continuar(): void {
    this.mensagem = this.limiteAtingido
      ? 'Você atingiu o limite de 2 avisos fixados.'
      : `Você ainda pode fixar ${2 - this.avisosFixados.length} aviso(s).`;
  }

  voltar(): void {
    this.mensagem = '';
  }

  adicionarAviso(): void {
    const titulo = this.novoTitulo.trim();

    if (!titulo) {
      this.mensagem = 'Digite o título do aviso.';
      return;
    }

    if (titulo.length > 100) {
      this.mensagem = 'O título pode ter no máximo 100 caracteres.';
      return;
    }

    let id = Date.now();

    while (this.avisos.some((aviso) => aviso.id === id)) {
      id++;
    }

    this.avisos.push({ id, titulo, fixado: false });
    this.novoTitulo = '';
    this.mensagem = '';
    this.salvar();
  }

  removerAviso(id: number): void {
    this.avisos = this.avisos.filter((aviso) => aviso.id !== id);
    this.mensagem = '';
    this.salvar();
  }

  iniciarArraste(event: DragEvent, id: number): void {
    this.avisoArrastado = id;

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(id));
    }
  }

  permitirSoltar(event: DragEvent): void {
    event.preventDefault();

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  soltar(
    event: DragEvent,
    destino: 'fixados' | 'normais'
  ): void {
    event.preventDefault();

    const textoId = event.dataTransfer?.getData('text/plain');
    const id = textoId
      ? Number(textoId)
      : this.avisoArrastado;

    if (id === null || id === undefined || !Number.isFinite(id)) {
      return;
    }

    const aviso = this.avisos.find((item) => item.id === id);

    if (!aviso) return;

    if (destino === 'fixados' && !aviso.fixado) {
      if (this.limiteAtingido) {
        this.mensagem = 'Desafixe um aviso para fixar outro.';
        this.avisoArrastado = null;
        return;
      }

      aviso.fixado = true;
    } else if (destino === 'normais') {
      aviso.fixado = false;
    }

    this.avisoArrastado = null;
    this.mensagem = '';
    this.salvar();
  }

  private salvar(): void {
    try {
      localStorage.setItem(
        'mural-avisos',
        JSON.stringify(this.avisos)
      );
    } catch {
      this.mensagem = 'Não foi possível salvar os dados neste navegador.';
    }
  }
}