
import { Component, OnInit } from '@angular/core';
import { IonApp } from '@ionic/angular/standalone';

interface Aviso {
  id: number;
  titulo: string;
  fixado: boolean;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp],
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
  avisoArrastado: number | null = null;

  ngOnInit(): void {
    try {
      const dados = localStorage.getItem('mural-avisos');

      if (dados) {
        const salvos = JSON.parse(dados) as Aviso[];

        if (Array.isArray(salvos)) {
          this.avisos = salvos.map((aviso) => ({
            ...aviso,
            fixado: Boolean(aviso.fixado)
          }));

          // Garante o limite mesmo se houver dados antigos inválidos.
          let quantidade = 0;

          this.avisos.forEach((aviso) => {
            if (aviso.fixado) {
              quantidade++;

              if (quantidade > 2) {
                aviso.fixado = false;
              }
            }
          });
        }
      }
    } catch {
      this.mensagem = 'Não foi possível recuperar os dados salvos.';
    }

    this.salvar();
  }

  get avisosNormais(): Aviso[] {
    return this.avisos.filter((aviso) => !aviso.fixado);
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
    if (this.limiteAtingido) {
      this.mensagem = 'Você pode fixar no máximo 2 avisos.';
      return;
    }

    this.mensagem = 'Você ainda pode fixar mais avisos.';
  }

  voltar(): void {
    this.mensagem = '';
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

  soltar(event: DragEvent, destino: 'fixados' | 'normais'): void {
    event.preventDefault();

    const idTexto = event.dataTransfer?.getData('text/plain');
    const id = idTexto ? Number(idTexto) : this.avisoArrastado;

    if (id == null || !Number.isFinite(id)) return;

    const aviso = this.avisos.find((item) => item.id === id);

    if (!aviso) return;

    if (destino === 'fixados' && !aviso.fixado) {
      if (this.limiteAtingido) {
        this.mensagem = 'Desafixe um aviso para fixar outro.';
        this.avisoArrastado = null;
        return;
      }

      aviso.fixado = true;
    }

    if (destino === 'normais') {
      aviso.fixado = false;
    }

    this.avisoArrastado = null;
    this.mensagem = '';
    this.salvar();
  }

  adicionarAviso(titulo: string): void {
    const nome = titulo.trim();

    if (!nome) {
      this.mensagem = 'Digite o título do aviso.';
      return;
    }

    this.avisos.push({
      id: Date.now(),
      titulo: nome,
      fixado: false
    });

    this.mensagem = '';
    this.salvar();
  }

  removerAviso(id: number): void {
    this.avisos = this.avisos.filter((aviso) => aviso.id !== id);
    this.mensagem = '';
    this.salvar();
  }

  private salvar(): void {
    try {
      localStorage.setItem('mural-avisos', JSON.stringify(this.avisos));
    } catch {
      this.mensagem = 'Não foi possível salvar os dados neste navegador.';
    }
  }
}